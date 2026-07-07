(function(){
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var API_BASE = new URLSearchParams(location.search).get("api") || "";

  // Estado global de "ja cadastrou", persistido no localStorage. A origem do
  // iframe e a mesma da app, entao a chave precisa ser exatamente esta pra nao
  // colidir com outras chaves (bnt_beta_token etc).
  var WAITLIST_KEY = "bnt_waitlist_signup";
  function hasSignedUp(){
    try { return localStorage.getItem(WAITLIST_KEY) === "1"; }
    catch(e){ return false; }
  }
  function markSignedUp(){
    try { localStorage.setItem(WAITLIST_KEY, "1"); }
    catch(e){}
  }
  // Aplica a confirmacao em TODOS os forms (idempotente). Nao dispara confete:
  // confete e so no momento do submit real, nao no re-aplicar do estado.
  function applySignedUpState(){
    document.querySelectorAll("[data-signup]").forEach(function(block){
      var scope = block.parentElement;
      var note = scope.querySelector("[data-note]");
      var success = scope.querySelector("[data-success]");
      block.style.display = "none";
      if(note) note.style.display = "none";
      if(success) success.classList.add("show");
    });
    // CTAs de scroll viram confirmacao: texto trocado, visual .btn-done, sem
    // pulso. Continuam clicaveis e rolando ate #topo, onde o bloco de sucesso
    // do hero confirma a inscricao. Trocar textContent tambem descarta o span
    // de glare interno, que nao faz sentido no estado concluido.
    document.querySelectorAll("[data-cta-label]").forEach(function(cta){
      cta.textContent = "Você está na lista ✓"; // TODO(Ana)
      cta.classList.add("btn-done");
      cta.classList.remove("btn-pulse");
      cta.setAttribute("aria-label", "Você já está na lista de espera"); // TODO(Ana)
    });
  }

  // Celebracao do cadastro: porte 1:1 do fireProCelebration da plataforma
  // (client/src/lib/proConfetti.ts) sobre o canvas-confetti vendorizado
  // (window.confetti, carregado por /confetti.browser.js). Recebe o ponto do
  // botao em pixels e converte pra origem normalizada (0..1). Devolve stop():
  // encerra o ciclo e limpa o canvas (confetti.reset), pro caminho de erro
  // cortar a festa na hora. Com prefers-reduced-motion ativo ou sem a lib
  // carregada, nao dispara nada e devolve um stop inofensivo (o cadastro segue
  // normal sem confetti).
  var CELEBRATION_COLORS = ["#FFB800","#1a1a1a","#ffffff","#10b981"];
  function fireSignupCelebration(x, y){
    var noop = function(){};
    if(reduce) return noop;
    var lib = window.confetti;
    if(typeof lib !== "function") return noop;

    var origin = { x: x / window.innerWidth, y: y / window.innerHeight };
    // Burst inicial mais forte, no ponto de origem.
    lib({ particleCount: 90, spread: 100, origin: origin, colors: CELEBRATION_COLORS, scalar: 0.9, ticks: 140, gravity: 0.85 });

    function randomInRange(min, max){ return Math.random() * (max - min) + min; }
    // Burst aleatorio espalhado: origem x/y e angulo randomicos cobrindo a tela.
    function fireScatter(){
      lib({ particleCount: 45, spread: randomInRange(70, 90), angle: randomInRange(60, 120), origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.1, 0.6) }, colors: CELEBRATION_COLORS, scalar: 0.9, ticks: 120, gravity: 0.9 });
    }
    // Canhao de um canto inferior disparando pra dentro/cima.
    function fireCannon(side){
      lib({ particleCount: 55, spread: 55, angle: side === "left" ? 60 : 120, startVelocity: 45, origin: { x: side === "left" ? 0 : 1, y: 1 }, colors: CELEBRATION_COLORS, scalar: 0.9, ticks: 140, gravity: 0.9 });
    }

    // Ciclo de 2s: aleatorio, canhao-esquerdo, aleatorio, canhao-direito, ...
    var sequence = [fireScatter, function(){ fireCannon("left"); }, fireScatter, function(){ fireCannon("right"); }];
    var end = Date.now() + 2000;
    var tick = 0;
    var interval = setInterval(function(){
      if(Date.now() >= end){ clearInterval(interval); return; }
      sequence[tick % sequence.length]();
      tick += 1;
    }, 240);

    return function(){
      clearInterval(interval);
      if(typeof lib.reset === "function") lib.reset();
    };
  }

  function wire(block){
    var input = block.querySelector("[data-email]");
    var btn = block.querySelector("[data-submit]");
    var scope = block.parentElement;
    var err = scope.querySelector("[data-err]");
    // Mensagem original de e-mail invalido (copy do design), preservada pra
    // restaurar quando a validacao falhar depois de um erro de rede.
    var invalidMsg = err ? err.textContent : "";
    // Texto original do botao DESTE form (nao depender de os forms serem iguais).
    var btnLabel = btn.textContent;
    // Trava de reentrada: impede fetches concorrentes por cliques repetidos.
    var sending = false;
    async function submit(){
      if(sending) return;
      var email = (input.value || "").trim();
      if(!EMAIL_RE.test(email)){ if(err){ err.textContent = invalidMsg; err.classList.add("show"); } input.focus(); return; }
      if(err) err.classList.remove("show");
      var r = btn.getBoundingClientRect();

      // Loading: botao travado + aria-busy no bloco durante o envio.
      sending = true;
      btn.disabled = true;
      btn.textContent = "Enviando..."; // TODO(Ana)
      block.setAttribute("aria-busy", "true");

      // Confetti otimista no clique (decisao de produto): dispara assim que a
      // validacao local passa. Se o POST falhar, stopCelebration corta o ciclo
      // e limpa o canvas junto com a mensagem de erro.
      var stopCelebration = fireSignupCelebration(r.left + r.width/2, r.top + r.height/2);

      // Timeout de 10s: aborta o fetch e cai no catch (mensagem de erro padrao).
      var controller = ("AbortController" in window) ? new AbortController() : null;
      var timeoutId = controller ? setTimeout(function(){ controller.abort(); }, 10000) : null;
      var succeeded = false;

      // INTEGRACAO: POST real pro backend (waitlist) + PostHog via parent.
      try {
        var res = await fetch(API_BASE + "/api/waitlist", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({email:email, source:"landing-lancamento"}),
          signal: controller ? controller.signal : undefined
        });
        if(!res.ok) throw new Error("waitlist falhou");
        succeeded = true;
        markSignedUp();
        applySignedUpState();
        try {
          window.parent.postMessage({ type:"bnt:waitlist_signup", source:"landing-lancamento" }, location.origin);
        } catch(e){}
      } catch(e){
        stopCelebration();
        // TODO(Ana): copy da mensagem de erro/retry do form.
        if(err){ err.textContent = "Deu ruim aqui, tenta de novo."; err.classList.add("show"); }
      } finally {
        if(timeoutId) clearTimeout(timeoutId);
        sending = false;
        block.removeAttribute("aria-busy");
        // No sucesso o form some (applySignedUpState); restaurar o botao so
        // faz sentido no caminho de erro, pra tentar de novo.
        if(!succeeded){
          btn.disabled = false;
          btn.textContent = btnLabel;
        }
      }
    }
    btn.addEventListener("click", submit);
    input.addEventListener("keydown", function(e){
      if(e.key === "Enter") submit();
      if(err.classList.contains("show")) err.classList.remove("show");
    });
  }
  document.querySelectorAll("[data-signup]").forEach(wire);
  if(hasSignedUp()) applySignedUpState();

  document.querySelectorAll("[data-scroll]").forEach(function(a){
    a.addEventListener("click", function(e){
      e.preventDefault();
      var hero = document.getElementById("topo");
      hero.scrollIntoView({behavior:"smooth", block:"start"});
      var input = hero.querySelector("[data-email]");
      // Ja inscrito: pula o foco de proposito, o scroll leva ate o bloco de
      // sucesso do hero. Fora isso, so foca se o input existir e estiver
      // visivel (dupla checagem, o offsetParent cobre outros casos de display).
      if(hasSignedUp()) return;
      if(input && input.offsetParent !== null){ setTimeout(function(){ input.focus(); }, 500); }
    });
  });

  // Indice lateral: clique rola suave ate a secao (sem o foco de input do
  // data-scroll). Scrollspy: a secao que cruza a faixa central da viewport
  // (rootMargin -45%/-45%) vira a ativa; nas secoes decorativas entre elas
  // nada intersecta e o ultimo item marcado permanece ativo.
  var tocItems = document.querySelectorAll(".toc-item");
  if(tocItems.length){
    var tocById = {};
    tocItems.forEach(function(item){
      var id = (item.getAttribute("href") || "").slice(1);
      tocById[id] = item;
      item.addEventListener("click", function(e){
        e.preventDefault();
        var target = document.getElementById(id);
        if(target) target.scrollIntoView({behavior:"smooth", block:"start"});
      });
    });
    // Parte do item marcado no HTML (o "Inicio" ja vem com .is-active pro
    // primeiro paint). Sem isso, um load com scroll restaurado no meio da
    // pagina deixaria dois itens ativos: o observer marcaria o novo sem
    // desmarcar o do HTML. setTocActive e idempotente, entao o primeiro
    // evento do observer no topo nao pisca nem duplica o estado.
    var tocActive = document.querySelector(".toc-item.is-active");
    function setTocActive(item){
      if(item === tocActive) return;
      if(tocActive){
        tocActive.classList.remove("is-active");
        tocActive.removeAttribute("aria-current");
      }
      tocActive = item;
      tocActive.classList.add("is-active");
      tocActive.setAttribute("aria-current", "true");
    }
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting && tocById[en.target.id]) setTocActive(tocById[en.target.id]);
      });
    }, {rootMargin:"-45% 0px -45% 0px", threshold:0});
    Object.keys(tocById).forEach(function(id){
      var sec = document.getElementById(id);
      if(sec) spy.observe(sec);
    });
  }

  if(!reduce){
    document.querySelectorAll(".btn-magnetic").forEach(function(b){
      b.addEventListener("mousemove", function(e){
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX-(r.left+r.width/2))*0.22) + "px," + ((e.clientY-(r.top+r.height/2))*0.32) + "px)";
      });
      b.addEventListener("mouseleave", function(){ b.style.transform = ""; });
    });
    var heroEl = document.querySelector(".hero"), journeyEl = document.getElementById("journey");
    if(heroEl && journeyEl){
      heroEl.addEventListener("mousemove", function(e){
        var r = heroEl.getBoundingClientRect();
        var px = (e.clientX-r.left)/r.width - 0.5, py = (e.clientY-r.top)/r.height - 0.5;
        journeyEl.style.transform = "perspective(900px) rotateY(" + (px*5) + "deg) rotateX(" + (-py*5) + "deg)";
      });
      heroEl.addEventListener("mouseleave", function(){ journeyEl.style.transform = ""; });
    }
  }

  var bar = document.getElementById("progress");
  function onScroll(){
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop || document.body.scrollTop)/max*100 : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();

  var words = ["se perder", "travar", "se afogar", "se enrolar"];
  var rotEl = document.getElementById("rot");
  if(rotEl && !reduce){
    var wi = 0;
    setInterval(function(){
      rotEl.style.opacity = "0";
      setTimeout(function(){ wi=(wi+1)%words.length; rotEl.textContent = words[wi]; rotEl.style.opacity = "1"; }, 280);
    }, 2600);
  }

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("is"); io.unobserve(en.target); } });
  }, {threshold:.14, rootMargin:"0px 0px -40px 0px"});
  document.querySelectorAll(".r, .stg").forEach(function(el){ io.observe(el); });

  function countUp(el, target){
    var dur = 1200, t0 = null;
    function step(ts){ if(!t0) t0=ts; var p=Math.min((ts-t0)/dur,1); el.textContent = Math.round((1-Math.pow(1-p,3))*target); if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var statsBox = document.getElementById("stats"), counted = false;
  var io2 = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting && !counted){
        counted = true;
        en.target.querySelectorAll("[data-count]").forEach(function(s){ countUp(s, parseInt(s.getAttribute("data-count"),10)); });
      }
    });
  }, {threshold:.3});
  if(statsBox) io2.observe(statsBox);

  // Countdown unico da pagina (o antigo script inline do HTML foi removido).
  // Alvo com offset explicito: meio-dia de Brasilia (UTC-3), todo visitante
  // conta pro mesmo instante independente do fuso. Um so intervalo alimenta
  // os relogios do hero e da band (.js-d/.js-h/.js-m/.js-s) e o chip compacto
  // do header ([data-hdr-timer]).
  (function(){
    var LAUNCH_AT = new Date("2026-07-14T12:00:00-03:00");
    var dEls = document.querySelectorAll(".js-d");
    var hEls = document.querySelectorAll(".js-h");
    var mEls = document.querySelectorAll(".js-m");
    var sEls = document.querySelectorAll(".js-s");
    var clocks = document.querySelectorAll(".clock, .clock-big");
    var hdrTimer = document.querySelector("[data-hdr-timer]");
    if(!clocks.length && !hdrTimer) return;
    var timer = null;

    function pad(n){ return (n < 10 ? "0" : "") + n; }
    function setAll(els, value){
      for(var i = 0; i < els.length; i++) els[i].textContent = value;
    }
    function showEnded(){
      for(var i = 0; i < clocks.length; i++){
        var msg = document.createElement("div");
        msg.className = "clock-ended";
        // TODO(Ana): revisar a copy do estado de lancamento no ar.
        msg.textContent = "Chegou o dia! Já estamos no ar.";
        clocks[i].textContent = "";
        clocks[i].appendChild(msg);
      }
      if(hdrTimer) hdrTimer.textContent = "No ar!"; // TODO(Ana)
    }
    function tick(){
      var diff = LAUNCH_AT.getTime() - Date.now();
      // Checa <= 0 antes de qualquer calculo: nunca renderiza numero negativo.
      if(diff <= 0){
        if(timer){ clearInterval(timer); timer = null; }
        showEnded();
        return;
      }
      var totalSec = Math.floor(diff / 1000);
      var d = Math.floor(totalSec / 86400);
      var h = Math.floor((totalSec % 86400) / 3600);
      var m = Math.floor((totalSec % 3600) / 60);
      var s = totalSec % 60;
      setAll(dEls, pad(d));
      setAll(hEls, pad(h));
      setAll(mEls, pad(m));
      setAll(sEls, pad(s));
      // TODO(Ana): formato compacto do header ("7d 14h 32min"; abaixo de 24h,
      // "14h 32min 05s").
      if(hdrTimer){
        hdrTimer.textContent = d > 0
          ? d + "d " + h + "h " + m + "min"
          : h + "h " + m + "min " + pad(s) + "s";
      }
    }

    tick();
    timer = setInterval(tick, 1000);
  })();
})();

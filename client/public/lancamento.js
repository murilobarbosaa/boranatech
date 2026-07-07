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

  function confetti(x, y){
    if(reduce) return;
    var colors = ["#FCC700","#6b1fc9","#0F172A","#8b4ff5","#ffffff"];
    for(var i=0;i<40;i++){
      var p = document.createElement("div");
      var size = 6 + Math.random()*8;
      p.style.cssText = "position:fixed;z-index:9999;pointer-events:none;border:1px solid #0F172A;border-radius:2px;width:"+size+"px;height:"+size+"px;background:"+colors[i%colors.length]+";left:"+x+"px;top:"+y+"px;will-change:transform,opacity;";
      document.body.appendChild(p);
      var ang = Math.random()*Math.PI*2, vel = 70 + Math.random()*200;
      var dx = Math.cos(ang)*vel, dy = Math.sin(ang)*vel - (90 + Math.random()*130);
      var rot = Math.random()*720 - 360;
      p.animate([
        {transform:"translate(0,0) rotate(0deg)", opacity:1},
        {transform:"translate("+dx+"px,"+(dy+320)+"px) rotate("+rot+"deg)", opacity:0}
      ], {duration:1000 + Math.random()*600, easing:"cubic-bezier(.2,.7,.3,1)"});
      (function(el){ setTimeout(function(){ el.remove(); }, 1800); })(p);
    }
  }

  function wire(block){
    var input = block.querySelector("[data-email]");
    var btn = block.querySelector("[data-submit]");
    var scope = block.parentElement;
    var err = scope.querySelector("[data-err]");
    // Mensagem original de e-mail invalido (copy do design), preservada pra
    // restaurar quando a validacao falhar depois de um erro de rede.
    var invalidMsg = err ? err.textContent : "";
    async function submit(){
      var email = (input.value || "").trim();
      if(!EMAIL_RE.test(email)){ if(err){ err.textContent = invalidMsg; err.classList.add("show"); } input.focus(); return; }
      if(err) err.classList.remove("show");
      var r = btn.getBoundingClientRect();
      // INTEGRACAO: POST real pro backend (waitlist) + PostHog via parent.
      try {
        var res = await fetch(API_BASE + "/api/waitlist", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({email:email, source:"landing-lancamento"})
        });
        if(!res.ok) throw new Error("waitlist falhou");
        markSignedUp();
        applySignedUpState();
        confetti(r.left + r.width/2, r.top + r.height/2);
        try {
          window.parent.postMessage({ type:"bnt:waitlist_signup", source:"landing-lancamento" }, location.origin);
        } catch(e){}
      } catch(e){
        // TODO(Ana): copy da mensagem de erro/retry do form.
        if(err){ err.textContent = "Deu ruim aqui, tenta de novo."; err.classList.add("show"); }
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

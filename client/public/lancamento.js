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
      // So foca se o input existir e estiver visivel. Pra quem ja se cadastrou
      // o input do hero esta escondido (data-success no lugar), entao o foco
      // vira no-op naturalmente.
      if(input && input.offsetParent !== null){ setTimeout(function(){ input.focus(); }, 500); }
    });
  });

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

  // ---- Countdown 01/07/2026 (Brasilia, UTC-3), atualiza todos os relogios ----
  var target = new Date("2026-07-01T00:00:00-03:00").getTime();
  function pad(n){ return String(n).padStart(2,"0"); }
  function setAll(cls, val){ var els = document.getElementsByClassName(cls); for(var i=0;i<els.length;i++){ els[i].textContent = val; } }
  function tick(){
    var diff = target - Date.now();
    if(diff <= 0){
      setAll("js-d","00"); setAll("js-h","00"); setAll("js-m","00"); setAll("js-s","00"); setAll("js-days","0");
      return;
    }
    var s = Math.floor(diff/1000), dd = Math.floor(s/86400);
    setAll("js-days", String(dd));
    setAll("js-d", pad(dd));
    setAll("js-h", pad(Math.floor((s%86400)/3600)));
    setAll("js-m", pad(Math.floor((s%3600)/60)));
    setAll("js-s", pad(s%60));
  }
  tick();
  setInterval(tick, 1000);
})();

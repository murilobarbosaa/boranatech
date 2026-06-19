import { useEffect, useState, type CSSProperties } from "react";
import { Rocket } from "lucide-react";

import UserAvatar from "@/components/UserAvatar";

// PROTOTIPO DESCARTAVEL. Bordas Pro animadas, so CSS, foco em PESO VISUAL.
// Base = avatar real do site (face com borda 2px + sombra flat offset por baixo).
// Camada Pro = anel GROSSO (5-7px) envolvendo o avatar, com um respiro pequeno,
// + glow suave saindo pra fora. Rotacao via transform (compositor), nao paint.
// NAO integra UserAvatar/editor, NAO toca backend/catalogo/gating. Pode apagar.

type EffectId = "rgb" | "gold" | "holo" | "glow" | "comet";

const EFFECTS: { id: EffectId; label: string; note: string }[] = [
  { id: "rgb", label: "Anel RGB girando", note: "conic rainbow grosso + glow violeta" },
  { id: "gold", label: "Dourado metalico", note: "facetas de ouro com specular percorrendo" },
  { id: "holo", label: "Holografico iridescente", note: "varredura ciano / magenta / dourado" },
  { id: "glow", label: "Glow respirando (marca)", note: "anel amarelo + halo pulsando devagar" },
  { id: "comet", label: "Cometa (bonus)", note: "specular branco percorrendo anel escuro do site" },
];

const PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='#ffd166'/><stop offset='1' stop-color='#ef476f'/>` +
      `</linearGradient></defs>` +
      `<rect width='200' height='200' fill='url(#g)'/>` +
      `<circle cx='100' cy='82' r='34' fill='#ffffff55'/>` +
      `<circle cx='100' cy='176' r='66' fill='#ffffff55'/></svg>`,
  );

// Base do site (face) + camada Pro (anel grosso + glow) por fora, com respiro.
function ProAvatar({
  effect,
  size,
  variant,
}: {
  effect: EffectId | "none";
  size: number;
  variant: "photo" | "icon";
}) {
  const ringw = Math.max(5, Math.round(size * 0.06));
  const gap = Math.max(2, Math.round(size * 0.03));
  const off = Math.max(3, Math.round(size * 0.06));
  const iconPx = Math.round(size * 0.4);
  const style = {
    "--core": `${size}px`,
    "--gap": `${gap}px`,
    "--ringw": `${ringw}px`,
    "--off": `${off}px`,
  } as CSSProperties;

  if (effect === "none") {
    // Avatar real do site, sem camada Pro: face (borda 2px) + sombra flat offset.
    return (
      <span className="pbp-plain" style={style}>
        <span className="pbp-plain-shadow" />
        <span className={`pbp-core ${variant === "icon" ? "icon" : ""}`}>
          {variant === "photo" ? (
            <img src={PHOTO} alt="" />
          ) : (
            <Rocket width={iconPx} height={iconPx} strokeWidth={2.75} />
          )}
        </span>
      </span>
    );
  }

  return (
    <span className={`pbp-stage fx-${effect}`} style={style}>
      <span className="pbp-shadow" />
      <span className="pbp-aura" />
      <span className="pbp-ring" />
      <span className={`pbp-core ${variant === "icon" ? "icon" : ""}`}>
        {variant === "photo" ? (
          <img src={PHOTO} alt="" />
        ) : (
          <Rocket width={iconPx} height={iconPx} strokeWidth={2.75} />
        )}
      </span>
    </span>
  );
}

function EffectCard({ fx }: { fx: { id: EffectId; label: string; note: string } }) {
  return (
    <div className="pbp-card">
      <div className="pbp-card-head">
        <span className="pbp-card-title">{fx.label}</span>
        <span className="pbp-card-note">{fx.note}</span>
      </div>
      <div className="pbp-row">
        <div className="pbp-cell">
          <ProAvatar effect={fx.id} size={120} variant="photo" />
          <span className="pbp-cell-label">Foto grande</span>
        </div>
        <div className="pbp-cell">
          <ProAvatar effect={fx.id} size={120} variant="icon" />
          <span className="pbp-cell-label">Icone grande</span>
        </div>
        <div className="pbp-cell">
          <div className="pbp-comment-box">
            <div className="pbp-comment">
              <ProAvatar effect={fx.id} size={40} variant="photo" />
              <div className="pbp-comment-body">
                <p className="pbp-comment-head">
                  <b>Maria Dev</b>
                  <span>ha 2h</span>
                </p>
                <p className="pbp-comment-text">
                  Comentario com avatar Pro no meio do texto, em container
                  apertado.
                </p>
              </div>
            </div>
            <div className="pbp-comment">
              <ProAvatar effect="none" size={40} variant="icon" />
              <div className="pbp-comment-body">
                <p className="pbp-comment-head">
                  <b>Vizinho</b>
                  <span>ha 1h</span>
                </p>
                <p className="pbp-comment-text">
                  Vizinho com a borda normal do site, pra comparar.
                </p>
              </div>
            </div>
          </div>
          <span className="pbp-cell-label">Comentario</span>
        </div>
      </div>
    </div>
  );
}

function FpsMeter() {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const loop = (t: number) => {
      frames += 1;
      if (t - last >= 500) {
        setFps(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span className="pbp-fps">{fps} FPS</span>;
}

export default function ProBordersPlayground() {
  const [feedEffect, setFeedEffect] = useState<EffectId>("rgb");
  const [showShadow, setShowShadow] = useState(true);

  return (
    <div className={`pbp ${showShadow ? "" : "no-shadow"}`}>
      <style>{CSS}</style>

      <h1 className="pbp-h1">Bordas Pro animadas (prototipo, v3)</h1>
      <div className="pbp-tag">PROTOTIPO DESCARTAVEL</div>
      <p className="pbp-warn">
        Base = avatar real do site (face com borda 2px + sombra flat offset). A
        camada Pro e um anel grosso (5-7px) por fora, com respiro, mais um glow
        suave. So CSS. Nao integra avatar/editor reais, nao toca backend, catalogo
        nem gating.
      </p>

      <label className="pbp-toggle">
        <input
          type="checkbox"
          checked={showShadow}
          onChange={(e) => setShowShadow(e.target.checked)}
        />
        Mostrar a sombra flat offset (desligue pra ver se o anel Pro fica melhor
        sem ela)
      </label>

      <h2 className="pbp-section-title">Geometria real (UserAvatar)</h2>
      <p className="pbp-section-sub">
        Bordas Pro pro-rgb e pro-holo renderizadas pelo UserAvatar real do site
        (mesma sombra offset + 2px). Anel fino colado na borda, sem anel grosso
        nem glow externo. Abaixo seguem as versoes bespoke do playground so como
        referencia.
      </p>
      {(["pro-rgb", "pro-holo", "pro-godzilla", "pro-storm"] as const).map((id) => (
        <div className="pbp-card" key={id}>
          <div className="pbp-card-head">
            <span className="pbp-card-title">{id}</span>
            <span className="pbp-card-note">UserAvatar real</span>
          </div>
          <div className="pbp-row">
            <div className="pbp-cell">
              <UserAvatar
                name="Maria Dev"
                border={id}
                mode="photo"
                avatarUrl={PHOTO}
                size="xl"
              />
              <span className="pbp-cell-label">Foto xl</span>
            </div>
            <div className="pbp-cell">
              <UserAvatar
                name="Maria Dev"
                border={id}
                icon="rocket"
                bg="yellow"
                size="xl"
              />
              <span className="pbp-cell-label">Icone xl</span>
            </div>
            <div className="pbp-cell">
              <div className="pbp-comment-box">
                <div className="pbp-comment">
                  <UserAvatar
                    name="Maria Dev"
                    border={id}
                    mode="photo"
                    avatarUrl={PHOTO}
                    size="sm"
                  />
                  <div className="pbp-comment-body">
                    <p className="pbp-comment-head">
                      <b>Maria Dev</b>
                      <span>ha 2h</span>
                    </p>
                    <p className="pbp-comment-text">
                      Avatar Pro real (size sm) ao lado de um comum.
                    </p>
                  </div>
                </div>
                <div className="pbp-comment">
                  <UserAvatar
                    name="Vizinho"
                    border="classic"
                    icon="code"
                    bg="slate"
                    size="sm"
                  />
                  <div className="pbp-comment-body">
                    <p className="pbp-comment-head">
                      <b>Vizinho</b>
                      <span>ha 1h</span>
                    </p>
                    <p className="pbp-comment-text">
                      Borda normal do site, pra comparar.
                    </p>
                  </div>
                </div>
              </div>
              <span className="pbp-cell-label">Comentario</span>
            </div>
          </div>
        </div>
      ))}

      <h2 className="pbp-section-title">Efeitos</h2>
      <p className="pbp-section-sub">
        Cada um em avatar grande (foto e icone) e numa linha de comentario apertada
        com um vizinho de borda normal pra comparar.
      </p>
      {EFFECTS.map((fx) => (
        <EffectCard key={fx.id} fx={fx} />
      ))}

      <h2 className="pbp-section-title">Feed simulado (performance)</h2>
      <p className="pbp-section-sub">
        20 avatares pequenos com o mesmo efeito (anel grosso + glow). Role a lista
        e troque o efeito pra sentir a suavidade no desktop e no celular. O FPS ao
        lado e aproximado.
      </p>
      <div className="pbp-controls">
        {EFFECTS.map((fx) => (
          <button
            key={fx.id}
            type="button"
            className={`pbp-btn ${feedEffect === fx.id ? "active" : ""}`}
            onClick={() => setFeedEffect(fx.id)}
          >
            {fx.id}
          </button>
        ))}
        <FpsMeter />
      </div>
      <div className="pbp-feed">
        {Array.from({ length: 20 }, (_, i) => (
          <div className="pbp-comment" key={i}>
            <ProAvatar
              effect={feedEffect}
              size={36}
              variant={i % 2 ? "icon" : "photo"}
            />
            <div className="pbp-comment-body">
              <p className="pbp-comment-head">
                <b>Pessoa {i + 1}</b>
                <span>ha {i + 1}h</span>
              </p>
              <p className="pbp-comment-text">
                Comentario de exemplo numero {i + 1} pra preencher o feed e medir a
                rolagem.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CSS = `
.pbp { min-height:100vh; background:#faf8f4; color:#0f172a; padding:32px 20px 96px; }
.pbp * { box-sizing:border-box; }
.pbp-h1 { font-weight:900; font-size:28px; letter-spacing:-.02em; margin:0; }
.pbp-tag { display:inline-block; margin-top:10px; border:2px solid #0f172a; background:#FFB800; padding:4px 10px; border-radius:9999px; font-weight:900; font-size:12px; }
.pbp-warn { margin-top:10px; max-width:800px; font-size:14px; font-weight:600; color:#475569; }
.pbp-toggle { display:flex; align-items:center; gap:8px; margin-top:14px; font-size:13px; font-weight:700; color:#334155; }
.pbp-section-title { margin:34px 0 4px; font-size:13px; font-weight:900; text-transform:uppercase; letter-spacing:.2em; }
.pbp-section-sub { font-size:13px; color:#64748b; font-weight:600; margin:0 0 16px; max-width:800px; }
.pbp-card { border:2px solid #0f172a; background:#fff; border-radius:20px; padding:18px; box-shadow:5px 5px 0 #0f172a; margin-bottom:18px; }
.pbp-card-head { display:flex; align-items:center; gap:10px; margin-bottom:8px; flex-wrap:wrap; }
.pbp-card-title { font-weight:900; font-size:16px; }
.pbp-card-note { font-size:12px; color:#64748b; font-weight:600; }
.pbp-row { display:flex; gap:28px; align-items:center; flex-wrap:wrap; }
.pbp-cell { display:flex; flex-direction:column; align-items:center; gap:12px; padding:20px 16px; }
.pbp-cell-label { font-size:11px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:.08em; }

/* face real do site: borda 2px + bg de marca + conteudo */
.pbp-core { position:absolute; top:50%; left:50%; width:var(--core); height:var(--core); transform:translate(-50%,-50%); z-index:3; border-radius:9999px; border:2px solid #0f172a; overflow:hidden; background:#faf8f4; color:#0f172a; display:flex; align-items:center; justify-content:center; }
.pbp-core.icon { background:#FFB800; }
.pbp-core img { width:100%; height:100%; object-fit:cover; display:block; }

/* avatar real sem Pro (vizinho): face + sombra flat offset */
.pbp-plain { position:relative; display:inline-block; vertical-align:middle; width:var(--core); height:var(--core); }
.pbp-plain .pbp-core { width:100%; height:100%; }
.pbp-plain-shadow { position:absolute; inset:0; border-radius:9999px; background:#0f172a; transform:translate(var(--off), var(--off)); z-index:0; }

/* stage Pro: outer = face + 2*(respiro + anel) */
.pbp-stage { --outer: calc(var(--core) + 2 * (var(--gap) + var(--ringw))); position:relative; display:inline-block; vertical-align:middle; width:var(--outer); height:var(--outer); }
.pbp-shadow { position:absolute; inset:0; border-radius:9999px; background:#0f172a; transform:translate(var(--off), var(--off)); z-index:0; }
.pbp.no-shadow .pbp-shadow { display:none; }
.pbp-aura { position:absolute; inset:-7px; border-radius:9999px; z-index:1; background:radial-gradient(circle, var(--aura, rgba(255,184,0,.5)), transparent 66%); filter:blur(6px); }
.pbp-ring { position:absolute; inset:0; border-radius:9999px; z-index:2;
  -webkit-mask:radial-gradient(farthest-side, #0000 calc(100% - var(--ringw)), #000 0);
          mask:radial-gradient(farthest-side, #0000 calc(100% - var(--ringw)), #000 0); }

@keyframes pbp-spin { to { transform:rotate(1turn); } }
@keyframes pbp-breath { 0%,100%{ opacity:.5; transform:scale(.96); } 50%{ opacity:1; transform:scale(1.08); } }

.fx-rgb { --aura: rgba(124,92,255,.5); }
.fx-rgb .pbp-ring { background:conic-gradient(#ff0040,#ff8a00,#ffe600,#00ff66,#00e5ff,#7a5cff,#ff00d4,#ff0040); animation:pbp-spin 3.2s linear infinite; }

.fx-gold { --aura: rgba(255,184,0,.55); }
.fx-gold .pbp-ring { background:conic-gradient(#fff6cf,#d4af37 12%,#8a6a12 26%,#f4e08a 40%,#fffaf0 50%,#b8860b 64%,#6b4e0a 76%,#e8c64d 90%,#fff6cf 100%); animation:pbp-spin 4.2s linear infinite; }

.fx-holo { --aura: rgba(0,229,255,.45); }
.fx-holo .pbp-ring { background:conic-gradient(#9af0ff,#ffd1f7,#fff3b0,#c8b6ff,#9af0ff,#ffd1f7,#fff3b0,#c8b6ff,#9af0ff); filter:saturate(1.25); animation:pbp-spin 2.8s linear infinite; }

.fx-comet { --aura: rgba(255,255,255,.4); }
.fx-comet .pbp-ring { background:conic-gradient(rgba(255,255,255,0) 0deg, rgba(255,255,255,0) 250deg, rgba(255,255,255,.95) 320deg, rgba(255,255,255,0) 360deg), #0f172a; animation:pbp-spin 2s linear infinite; }

.fx-glow { --aura: rgba(255,184,0,.7); }
.fx-glow .pbp-ring { background:#FFB800; }
.fx-glow .pbp-aura { animation:pbp-breath 2.8s ease-in-out infinite; }

.pbp-comment { display:flex; gap:12px; align-items:flex-start; padding:10px 0; }
.pbp-comment-body { font-size:14px; }
.pbp-comment-head b { font-weight:900; }
.pbp-comment-head span { color:#94a3b8; font-weight:600; font-size:12px; margin-left:6px; }
.pbp-comment-text { color:#334155; font-weight:500; margin-top:2px; max-width:420px; }
.pbp-comment-box { border:2px solid #e2e8f0; border-radius:16px; padding:6px 16px; background:#fff; max-width:540px; }

.pbp-controls { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:14px; }
.pbp-btn { border:2px solid #0f172a; background:#fff; border-radius:9999px; padding:6px 14px; font-weight:900; font-size:13px; cursor:pointer; text-transform:capitalize; }
.pbp-btn.active { background:#FFB800; box-shadow:2px 2px 0 #0f172a; }
.pbp-fps { margin-left:auto; border:2px solid #0f172a; background:#0f172a; color:#fff; border-radius:9999px; padding:4px 12px; font-weight:900; font-size:13px; font-variant-numeric:tabular-nums; }
.pbp-feed { border:2px solid #e2e8f0; border-radius:16px; background:#fff; max-height:440px; overflow:auto; }
.pbp-feed .pbp-comment { padding:14px 16px; border-bottom:1px solid #f1f5f9; }

@media (prefers-reduced-motion: reduce) {
  .pbp-ring, .pbp-aura { animation: none !important; }
}
`;

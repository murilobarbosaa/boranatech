import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { slugify } from "@/lib/slugify";

type LogoItem = {
  name: string;
  icon: string;
  kind: "technology" | "tool";
  slug?: string;
};

const LOGOS: LogoItem[] = [
  {
    name: "HTML5",
    icon: "simple-icons:html5",
    kind: "technology",
    slug: "html",
  },
  { name: "CSS3", icon: "simple-icons:css3", kind: "technology", slug: "css" },
  { name: "JavaScript", icon: "simple-icons:javascript", kind: "technology" },
  { name: "TypeScript", icon: "simple-icons:typescript", kind: "technology" },
  { name: "React", icon: "simple-icons:react", kind: "technology" },
  {
    name: "Vue",
    icon: "simple-icons:vuedotjs",
    kind: "technology",
    slug: "vuejs",
  },
  { name: "Python", icon: "simple-icons:python", kind: "technology" },
  { name: "Java", icon: "simple-icons:openjdk", kind: "technology" },
  { name: "C#", icon: "simple-icons:csharp", kind: "technology" },
  { name: "Node.js", icon: "simple-icons:nodedotjs", kind: "technology" },
  { name: "MySQL", icon: "simple-icons:mysql", kind: "technology" },
  { name: "MongoDB", icon: "simple-icons:mongodb", kind: "technology" },
  { name: "Docker", icon: "simple-icons:docker", kind: "technology" },
  { name: "AWS", icon: "simple-icons:amazonwebservices", kind: "technology" },
  { name: "Git", icon: "simple-icons:git", kind: "technology" },
  { name: "GitHub", icon: "simple-icons:github", kind: "tool" },
  { name: "VS Code", icon: "simple-icons:visualstudiocode", kind: "tool" },
  { name: "Figma", icon: "simple-icons:figma", kind: "technology" },
  { name: "Linux", icon: "simple-icons:linux", kind: "technology" },
];

function hrefFor(item: LogoItem) {
  if (item.kind === "tool") return "/ferramentas";
  return `/tecnologias/${item.slug ?? slugify(item.name)}`;
}

function LogoLink({ item }: { item: LogoItem }) {
  const label =
    item.kind === "tool"
      ? `Ver ferramenta ${item.name}`
      : `Ver tecnologia ${item.name}`;
  return (
    <Link
      href={hrefFor(item)}
      title={item.name}
      aria-label={label}
      className="group flex shrink-0 cursor-pointer items-center justify-center rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-violet-300"
    >
      <Icon
        icon={item.icon}
        width={48}
        height={48}
        className="text-slate-950 transition-all duration-300 group-hover:scale-110 group-hover:text-violet-600"
      />
    </Link>
  );
}

export default function LogoLoop() {
  // Duplicar a lista permite loop infinito sem "salto": a animação
  // translada -50% (= 1x a lista original) e ao voltar a 0% o visual
  // é idêntico porque a sequência já se repetiu.
  const duplicatedLogos = [...LOGOS, ...LOGOS];

  return (
    <section className="relative overflow-hidden py-10 md:py-14">
      {/* Camada 1: gradient base cream → violet pastel.
          Topo cream conecta com a Hero, base violet conecta com o
          Mapa (que agora começa em violet-50 puro, sem cream). */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, #faf8f4 0%, #f5f3ff 100%)",
        }}
        aria-hidden="true"
      />

      {/* Camada 2: dot grid pattern, textura constante de pontinhos violet */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #c4b5fd 1.2px, transparent 1.2px)",
          backgroundSize: "28px 28px",
          opacity: 0.4,
        }}
        aria-hidden="true"
      />

      {/* Camada 3: ondas SVG tracejadas no topo e base, continua a
          estética das linhas da jornada da Hero. preserveAspectRatio="none"
          estica horizontalmente; vectorEffect="non-scaling-stroke" mantém
          a espessura visual constante independente do scaling. */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M -5 18 Q 25 12, 50 18 T 105 16"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="0.3"
          strokeDasharray="1.5 2"
          strokeLinecap="round"
          opacity="0.6"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M -5 82 Q 25 88, 50 82 T 105 84"
          fill="none"
          stroke="#a78bfa"
          strokeWidth="0.3"
          strokeDasharray="1.5 2"
          strokeLinecap="round"
          opacity="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden"
        >
          {/* Fade nas bordas: esconde os logos "nascendo" */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32"
            style={{
              // Fade esquerdo violet pastel (combina com o background
              // violet da seção, antes era cream e criava manchas
              // visíveis nas laterais).
              background: "linear-gradient(to right, #f5f3ff 10%, transparent)",
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32"
            style={{
              // Fade direito também violet pastel (mesma cor do
              // esquerdo, bordas invisíveis contra o fundo violet).
              background: "linear-gradient(to left, #f5f3ff 10%, transparent)",
            }}
            aria-hidden="true"
          />

          <div className="flex w-max items-center gap-14 py-2 animate-loop-slow will-change-transform">
            {duplicatedLogos.map((logo, idx) => (
              <LogoLink key={`${logo.name}-${idx}`} item={logo} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

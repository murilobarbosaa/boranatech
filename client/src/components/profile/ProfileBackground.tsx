import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export function ProfileBackground() {
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  const violetX = useTransform(scrollY, [0, 2000], [0, prefersReducedMotion ? 0 : 100]);
  const violetY = useTransform(scrollY, [0, 2000], [0, prefersReducedMotion ? 0 : 200]);
  const violetScale = useTransform(scrollY, [0, 2000], [1, prefersReducedMotion ? 1 : 1.3]);
  const violetSkew = useTransform(scrollY, [0, 2000], [0, prefersReducedMotion ? 0 : -8]);

  const amberX = useTransform(scrollY, [0, 2000], [0, prefersReducedMotion ? 0 : -150]);
  const amberY = useTransform(scrollY, [0, 2000], [0, prefersReducedMotion ? 0 : -100]);
  const amberScale = useTransform(scrollY, [0, 2000], [1, prefersReducedMotion ? 1 : 1.4]);
  const amberSkew = useTransform(scrollY, [0, 2000], [0, prefersReducedMotion ? 0 : 12]);

  const emeraldX = useTransform(scrollY, [0, 2000], [0, prefersReducedMotion ? 0 : 80]);
  const emeraldY = useTransform(scrollY, [0, 2000], [0, prefersReducedMotion ? 0 : -250]);
  const emeraldScale = useTransform(scrollY, [0, 2000], [1, prefersReducedMotion ? 1 : 1.2]);
  const emeraldSkew = useTransform(scrollY, [0, 2000], [0, prefersReducedMotion ? 0 : -5]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#faf8f4]" />

      <motion.div
        style={{ x: violetX, y: violetY, scale: violetScale, skewX: violetSkew }}
        className="absolute -left-[20%] -top-[10%] h-[80vh] w-[80vh]"
      >
        <div
          className="h-full w-full rounded-[50%]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(139, 92, 246, 0.45) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 75%)",
            filter: "blur(60px)",
          }}
        />
      </motion.div>

      <motion.div
        style={{ x: amberX, y: amberY, scale: amberScale, skewX: amberSkew }}
        className="absolute -right-[15%] top-[30%] h-[90vh] w-[90vh]"
      >
        <div
          className="h-full w-full rounded-[50%]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(251, 191, 36, 0.40) 0%, rgba(251, 191, 36, 0.15) 50%, transparent 75%)",
            filter: "blur(70px)",
          }}
        />
      </motion.div>

      <motion.div
        style={{ x: emeraldX, y: emeraldY, scale: emeraldScale, skewX: emeraldSkew }}
        className="absolute -left-[10%] top-[70%] h-[70vh] w-[70vh]"
      >
        <div
          className="h-full w-full rounded-[50%]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(52, 211, 153, 0.35) 0%, rgba(52, 211, 153, 0.12) 50%, transparent 75%)",
            filter: "blur(65px)",
          }}
        />
      </motion.div>

      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E\")",
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}

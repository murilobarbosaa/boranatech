import { type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface CircularTextProps {
  text: string;
  className?: string;
  duration?: number;
  radius?: number;
}

export default function CircularText({
  text,
  className,
  duration = 22,
  radius = 46,
}: CircularTextProps) {
  const reduce = useReducedMotion();
  const chars = Array.from(text);
  const step = 360 / chars.length;

  return (
    <motion.div
      aria-hidden
      className={`relative ${className ?? ""}`}
      animate={reduce ? undefined : { rotate: 360 }}
      transition={
        reduce
          ? undefined
          : { duration, repeat: Infinity, ease: "linear" }
      }
    >
      {chars.map((ch, i) => {
        const charStyle: CSSProperties = {
          transform: `translate(-50%, -50%) rotate(${i * step}deg) translateY(-${radius}px)`,
        };
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 text-[0.6rem] font-black uppercase tracking-[0.15em]"
            style={charStyle}
          >
            {ch}
          </span>
        );
      })}
    </motion.div>
  );
}

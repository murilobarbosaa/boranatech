import { type ReactNode, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface AnimatedContentProps {
  children: ReactNode;
  distance?: number;
  direction?: "vertical" | "horizontal";
  reverse?: boolean;
  duration?: number;
  delay?: number;
  className?: string;
}

export default function AnimatedContent({
  children,
  distance = 20,
  direction = "vertical",
  reverse = false,
  duration = 0.5,
  delay = 0,
  className,
}: AnimatedContentProps) {
  const prefersReduced = useReducedMotion();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const t = setTimeout(
      () => setSettled(true),
      (delay + duration) * 1000 + 300,
    );
    return () => clearTimeout(t);
  }, [delay, duration]);

  if (prefersReduced || settled) {
    return <div className={className}>{children}</div>;
  }

  const offset = reverse ? -distance : distance;
  const initial =
    direction === "horizontal"
      ? { opacity: 0, x: offset }
      : { opacity: 0, y: offset };
  const target =
    direction === "horizontal" ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={target}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

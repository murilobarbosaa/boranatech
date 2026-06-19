import { Fragment, type CSSProperties, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SplitTextProps {
  text: string;
  className?: string;
  style?: CSSProperties;
  splitType?: "chars" | "words";
  delay?: number;
  duration?: number;
}

export default function SplitText({
  text,
  className,
  style,
  splitType = "words",
  delay = 45,
  duration = 0.5,
}: SplitTextProps) {
  const reduce = useReducedMotion();
  const [settled, setSettled] = useState(false);
  const parts = splitType === "chars" ? Array.from(text) : text.split(" ");

  useEffect(() => {
    const total = (parts.length * delay) / 1000 + duration + 0.3;
    const t = setTimeout(() => setSettled(true), total * 1000);
    return () => clearTimeout(t);
  }, [text, delay, duration, parts.length]);

  if (reduce || settled) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    );
  }

  return (
    <span className={className} style={style} aria-label={text}>
      {parts.map((part, i) => (
        <Fragment key={i}>
          <motion.span
            aria-hidden
            className="inline-block"
            initial={{ opacity: 0, y: "0.45em" }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration, delay: (i * delay) / 1000, ease: "easeOut" }}
          >
            {part}
          </motion.span>
          {splitType === "words" && i < parts.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}

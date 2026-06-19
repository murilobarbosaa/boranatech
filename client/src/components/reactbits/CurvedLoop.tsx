import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface CurvedLoopProps {
  items: string[];
  separator?: string;
  speed?: number;
  className?: string;
  curveAmount?: number;
}

export default function CurvedLoop({
  items,
  separator = "  •  ",
  speed = 0.5,
  className,
  curveAmount = 48,
}: CurvedLoopProps) {
  const reduce = useReducedMotion();
  const rawId = useId();
  const pathId = `cl-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const measureRef = useRef<SVGTextElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const offsetRef = useRef(0);
  const [blockLen, setBlockLen] = useState(0);

  const block = items.join(separator) + separator;
  const full = block.repeat(8);

  useEffect(() => {
    if (measureRef.current) {
      const len = measureRef.current.getComputedTextLength();
      if (len > 0) setBlockLen(len);
    }
  }, [block]);

  useEffect(() => {
    if (reduce || blockLen === 0) return;
    let raf = 0;
    const tick = () => {
      offsetRef.current -= speed;
      if (offsetRef.current <= -blockLen) offsetRef.current += blockLen;
      const el = textPathRef.current;
      if (el) el.setAttribute("startOffset", String(offsetRef.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, blockLen, speed]);

  const path = `M 0 95 Q 800 ${95 - curveAmount} 1600 95`;

  return (
    <div className="pointer-events-none w-full overflow-hidden" aria-hidden>
      <svg
        viewBox="0 0 1600 120"
        className="block h-24 w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <path id={pathId} d={path} fill="none" />
        </defs>
        <text ref={measureRef} visibility="hidden" className={className}>
          {block}
        </text>
        <text className={className}>
          <textPath ref={textPathRef} href={`#${pathId}`} startOffset="0">
            {full}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

import { useEffect, useRef } from "react";
import {
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  className?: string;
  separator?: string;
  startWhen?: boolean;
}

export default function CountUp({
  to,
  from = 0,
  duration = 1.2,
  delay = 0,
  className,
  separator = "",
  startWhen = true,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReduced = useReducedMotion();
  const motionValue = useMotionValue(from);
  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const format = (value: number) => {
    const text = String(Math.round(value));
    return separator
      ? text.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
      : text;
  };

  useEffect(() => {
    if (!ref.current) return;
    ref.current.textContent = format(prefersReduced ? to : from);
  }, [from, to, prefersReduced]);

  useEffect(() => {
    if (prefersReduced || !isInView || !startWhen) return;
    const timeoutId = setTimeout(() => {
      motionValue.set(to);
    }, delay * 1000);
    return () => clearTimeout(timeoutId);
  }, [isInView, startWhen, prefersReduced, motionValue, to, delay]);

  useEffect(() => {
    if (prefersReduced || !startWhen) return;
    const safety = setTimeout(
      () => {
        if (ref.current) ref.current.textContent = format(to);
      },
      delay * 1000 + duration * 1000 + 400,
    );
    return () => clearTimeout(safety);
  }, [prefersReduced, startWhen, to, delay, duration]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest: number) => {
      if (ref.current) ref.current.textContent = format(latest);
    });
    return () => unsubscribe();
  }, [springValue, separator]);

  return <span className={className} ref={ref} />;
}

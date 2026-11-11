"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (
      !root.current ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={root} className={`reveal ${className}`} data-entered={entered}>
      {children}
    </div>
  );
}

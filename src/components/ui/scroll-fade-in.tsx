"use client";

import { useScrollAnimation } from "@/lib/useScrollAnimation";
import { type ReactNode } from "react";

interface ScrollFadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  threshold?: number;
  direction?: "up" | "down" | "left" | "right";
}

export function ScrollFadeIn({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  direction = "up",
}: ScrollFadeInProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold, triggerOnce: true });

  const directionStyles = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
  };

  return (
    <div
      ref={ref}
      className={`transition-all ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate(0, 0)" : undefined,
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
      }}
    >
      <div
        className={`${!isVisible ? directionStyles[direction] : ""} transition-transform`}
        style={{
          transitionDuration: `${duration}s`,
          transitionDelay: `${delay}s`,
        }}
      >
        {children}
      </div>
    </div>
  );
}


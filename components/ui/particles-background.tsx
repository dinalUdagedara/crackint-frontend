"use client";

import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

type ParticlesBackgroundProps = {
  className?: string;
  id?: string;
};

export function ParticlesBackground({
  className,
  id = "tsparticles-bg",
}: ParticlesBackgroundProps) {
  const [ready, setReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, [reduceMotion]);

  const options: ISourceOptions = useMemo(() => {
    const dark = resolvedTheme === "dark";
    const link = dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.2)";
    const dot = dark ? "#ffffff" : "#171717";

    return {
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: { enable: false },
          onClick: { enable: false },
        },
      },
      particles: {
        color: { value: dot },
        links: {
          enable: true,
          distance: 140,
          color: link,
          opacity: 0.9,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: { default: "bounce" },
          random: false,
          speed: 0.5,
          straight: false,
        },
        number: {
          density: { enable: true, area: 900 },
          value: 56,
        },
        opacity: { value: { min: 0.25, max: 0.55 } },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 2.5 } },
      },
      detectRetina: true,
    };
  }, [resolvedTheme]);

  if (reduceMotion || !ready) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 min-h-[100dvh] overflow-hidden ${className ?? ""}`}
      aria-hidden
    >
      <Particles className="size-full min-h-[100dvh]" id={id} options={options} />
    </div>
  );
}

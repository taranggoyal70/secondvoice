"use client";
import { useEffect, useRef } from "react";

export type SculptureStyle = "orbit" | "ribbon" | "bloom";
type Phase =
  "ready" | "connecting" | "speaking" | "stopped" | "complete" | "error";
type Props = {
  style: SculptureStyle;
  phase: Phase;
  heard: number;
  text: string;
  run: number;
  revised: boolean;
};

/** A procedural stage for speech state, not an audio-frequency measurement. */
export function VoiceSculpture(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  const wake = useRef<(() => void) | null>(null);
  useEffect(() => {
    latest.current = props;
    wake.current?.();
  }, [props]);

  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      disposed = false,
      visible = true,
      width = 0,
      height = 0;
    let clock = 0,
      lastTime = 0,
      lastRun = -1,
      lastHeard = -1;
    let lastPhase: Phase = "ready",
      transitionAt = 0,
      wordAt = -10000,
      completedAt = -10000;
    let transitionClock = 0;

    const draw = (now: number) => {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      const state = latest.current;
      const reduced = motion.matches;
      if (lastRun !== state.run) {
        lastRun = state.run;
        transitionAt = now;
        transitionClock = clock;
        lastHeard = state.heard;
        wordAt = -10000;
      }
      if (state.heard !== lastHeard) {
        wordAt = now;
        lastHeard = state.heard;
      }
      if (state.phase !== lastPhase) {
        if (state.phase === "complete") completedAt = now;
        lastPhase = state.phase;
      }
      const active = state.phase === "speaking" || state.phase === "connecting";
      const finishing = state.phase === "complete" && now - completedAt < 800;
      const delta = lastTime ? Math.min(0.04, (now - lastTime) / 1000) : 0;
      lastTime = now;
      if (active && !reduced)
        clock += delta * (state.phase === "connecting" ? 0.35 : 1);
      const t = reduced ? 0 : clock;
      const impulse =
        active && !reduced ? Math.max(0, 1 - (now - wordAt) / 400) : 0;
      const complete =
        state.phase === "complete"
          ? reduced
            ? 1
            : Math.min(1, (now - completedAt) / 800)
          : 0;
      const revision =
        state.revised && active && !reduced
          ? Math.max(0, 1 - (now - transitionAt) / 900)
          : 0;
      const frozen = state.phase === "stopped" || state.phase === "error";
      const scale = Math.min(width / 500, height / 190);
      const cx = width * 0.5,
        cy = height * 0.5;
      context.clearRect(0, 0, width, height);
      const colors = frozen
        ? ["#d8a5b7", "#a78098"]
        : state.revised
          ? ["#f3bfcd", "#c9adf2"]
          : state.style === "bloom"
            ? ["#9de4d4", "#bdb4ff"]
            : state.style === "ribbon"
              ? ["#f6c5a1", "#ed91b3"]
              : ["#c7b0ef", "#b7d5ec"];
      const project = (x: number, y: number, z: number) => {
        const angle = t * 0.22 + (state.revised ? 0.35 : 0);
        const xx = x * Math.cos(angle) + z * Math.sin(angle);
        const zz = z * Math.cos(angle) - x * Math.sin(angle);
        const depth = 520 / (520 + zz);
        return {
          x: cx + xx * scale * depth,
          y: cy + (y + zz * 0.12) * scale * depth,
          depth,
        };
      };
      context.save();
      context.translate(cx, height * 0.9);
      context.scale(1, 0.14);
      const shadow = context.createRadialGradient(0, 0, 0, 0, 0, 140 * scale);
      shadow.addColorStop(0, "#bfa3f524");
      shadow.addColorStop(1, "#bfa3f500");
      context.fillStyle = shadow;
      context.beginPath();
      context.arc(0, 0, 140 * scale, 0, Math.PI * 2);
      context.fill();
      context.restore();
      const lines = 19,
        steps = 86;
      for (let line = 0; line < lines; line++) {
        context.beginPath();
        const offset = line / (lines - 1);
        for (let step = 0; step <= steps; step++) {
          const u = step / steps,
            a = u * Math.PI * 2;
          let x: number, y: number, z: number;
          const size = 1 + impulse * 0.07 + revision * 0.13 + complete * 0.1;
          if (state.style === "orbit") {
            const radius = (88 + offset * 34) * size;
            const tilt = offset * 1.5 + 0.32;
            x = Math.cos(a) * radius;
            y = Math.sin(a) * radius * Math.sin(tilt) * 0.51;
            z = Math.sin(a) * radius * Math.cos(tilt);
            y +=
              Math.sin(a * 3 + t * 1.4 + offset * 4) *
              (active ? 7 + impulse * 7 : 2);
          } else if (state.style === "ribbon") {
            x = (u - 0.5) * 330 * size;
            const wave = Math.sin(u * Math.PI) ** 1.4;
            const twist = u * Math.PI * 3 + t * 0.9 + offset * 0.65;
            const radius = (24 + offset * 35) * wave * size;
            y = Math.sin(twist) * radius;
            z = Math.cos(twist) * radius + (offset - 0.5) * 28;
          } else {
            const petals = 5;
            const radius =
              (53 +
                Math.cos(a * petals + t * 0.38) * (15 + offset * 16) +
                offset * 34) *
              size;
            x = Math.cos(a) * radius;
            y = Math.sin(a) * radius * 0.55;
            z = Math.sin(a * petals + offset * 3 + t * 0.6) * 34;
          }
          if (revision) {
            z += Math.sin(a + transitionClock) * revision * 23;
          }
          const point = project(x, y, z);
          if (step === 0) context.moveTo(point.x, point.y);
          else context.lineTo(point.x, point.y);
        }
        context.strokeStyle = colors[line % 2];
        context.globalAlpha = 0.14 + offset * 0.52;
        context.lineWidth =
          (line % 6 === 0 ? 1.35 : 0.65) * Math.max(0.7, scale);
        context.stroke();
      }
      context.globalAlpha = 1;
      const words = state.text.trim().split(/\s+/).filter(Boolean);
      const current =
        words[Math.max(0, Math.min(words.length - 1, state.heard - 1))] ?? "";
      const label =
        state.phase === "error"
          ? "!"
          : frozen
            ? "Ⅱ"
            : state.phase === "complete"
              ? "✓"
              : state.heard
                ? current
                : "";
      if (label) {
        context.font = `500 ${Math.max(16, 24 * scale)}px Arial`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.shadowColor = "#272234";
        context.shadowBlur = 12;
        context.fillStyle = frozen ? "#f4c1ce" : "#f7f1ff";
        context.fillText(label, cx, cy, Math.min(width * 0.36, 180));
        context.shadowBlur = 0;
      }
      if (active && !reduced) {
        for (let i = 0; i < 12; i++) {
          const a = t * 0.8 + i * 2.399;
          const p = project(
            Math.cos(a) * (137 + (i % 3) * 8),
            Math.sin(a * 1.2) * 52,
            Math.sin(a) * 70,
          );
          context.beginPath();
          context.arc(
            p.x,
            p.y,
            (i % 3 === 0 ? 1.7 : 0.8) * scale,
            0,
            Math.PI * 2,
          );
          context.globalAlpha = 0.3 + (Math.sin(t * 2 + i) + 1) * 0.25;
          context.fillStyle = colors[i % 2];
          context.fill();
        }
      }
      context.globalAlpha = 1;
      element.dataset.phase = state.phase;
      element.dataset.motion = reduced ? "reduced" : "expressive";
      if ((active || finishing) && !reduced)
        frame = requestAnimationFrame(draw);
    };
    const schedule = () => {
      if (!frame && !disposed && visible && !document.hidden)
        frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      const rect = element.getBoundingClientRect(),
        ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      schedule();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      lastTime = 0;
      if (!visible) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    });
    intersection.observe(element);
    const visibility = () => {
      lastTime = 0;
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    };
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", schedule);
    wake.current = schedule;
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      wake.current = null;
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", schedule);
    };
  }, []);
  return (
    <canvas
      ref={canvas}
      className="voice-sculpture"
      aria-hidden="true"
      data-style={props.style}
    />
  );
}

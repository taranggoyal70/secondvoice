"use client";

import { useEffect, useRef } from "react";
import type { StudioPhase } from "@/lib/demo";

type VoiceTerrainProps = {
  energy: number;
  phase: StudioPhase;
  progress: number;
  reducedMotion: boolean;
};

export function VoiceTerrain({ energy, phase, progress, reducedMotion }: VoiceTerrainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ energy, phase, progress, reducedMotion });

  useEffect(() => {
    stateRef.current = { energy, phase, progress, reducedMotion };
  }, [energy, phase, progress, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let startedAt = performance.now();

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(bounds.width));
      height = Math.max(1, Math.floor(bounds.height));
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (now: number) => {
      const current = stateRef.current;
      const time = current.reducedMotion ? 0 : (now - startedAt) / 1000;
      const activity = current.phase === "speaking" ? Math.max(0.18, current.energy) : current.phase === "composing" ? 0.08 : 0.025;
      const horizon = height * 0.24;

      context.clearRect(0, 0, width, height);
      context.fillStyle = "#090c11";
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(123, 140, 158, 0.12)";
      context.lineWidth = 1;
      for (let column = 0; column <= 12; column += 1) {
        const bottomX = (column / 12) * width;
        context.beginPath();
        context.moveTo(width / 2, horizon);
        context.lineTo(bottomX, height);
        context.stroke();
      }

      for (let row = 0; row < 30; row += 1) {
        const depth = row / 29;
        const y = horizon + Math.pow(depth, 1.62) * height * 0.72;
        const alpha = 0.08 + depth * 0.42;
        const amplitude = (8 + activity * 48) * (0.35 + depth * 0.95);
        const speed = current.phase === "speaking" ? 3.1 : 0.65;

        context.beginPath();
        for (let x = 0; x <= width; x += 5) {
          const normalized = x / width;
          const envelope = Math.pow(Math.sin(Math.PI * normalized), 1.4);
          const primary = Math.sin(normalized * 26 + time * speed + row * 0.32);
          const harmonic = Math.sin(normalized * 62 - time * 1.4 + row * 0.17) * 0.34;
          const voice = (primary + harmonic) * amplitude * envelope;
          const pointY = y - voice * (1 - depth * 0.28);
          if (x === 0) context.moveTo(x, pointY);
          else context.lineTo(x, pointY);
        }
        context.strokeStyle = row % 5 === 0
          ? `rgba(232, 180, 79, ${Math.min(0.72, alpha + 0.16)})`
          : `rgba(106, 175, 251, ${alpha})`;
        context.lineWidth = row % 5 === 0 ? 1.5 : 1;
        context.stroke();
      }

      const sweepX = width * 0.08 + width * 0.84 * current.progress;
      const sweepColor = current.phase === "interrupted" ? "#f06a5c" : "#e8b44f";
      context.strokeStyle = sweepColor;
      context.lineWidth = current.phase === "interrupted" ? 4 : 2;
      context.beginPath();
      context.moveTo(sweepX, horizon - 18);
      context.lineTo(sweepX, height);
      context.stroke();

      context.fillStyle = sweepColor;
      context.beginPath();
      context.arc(sweepX, horizon - 18, 4.5, 0, Math.PI * 2);
      context.fill();

      frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      startedAt = 0;
    };
  }, []);

  return (
    <figure className={`voice-terrain voice-terrain--${phase}`}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Live voice terrain. ${Math.round(progress * 100)} percent of the current message has reached playback.`}
      />
      <figcaption>
        <span>Live voice terrain</span>
        <strong>AssemblyAI TTS-1 · 24 kHz PCM</strong>
      </figcaption>
      <div className="terrain-legend" aria-hidden="true">
        <span><i className="legend-line legend-line--heard" /> heard audio</span>
        <span><i className="legend-line legend-line--voice" /> voice energy</span>
        <span>{Math.round(progress * 100)}% received</span>
      </div>
      {phase === "interrupted" ? <div className="terrain-cut">Playback cut at heard boundary</div> : null}
    </figure>
  );
}

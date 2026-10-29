"use client";

import type { CSSProperties } from "react";
import type { StudioPhase } from "@/lib/demo";

type VoiceTapeDeckProps = {
  energy: number;
  phase: StudioPhase;
  progress: number;
  reducedMotion: boolean;
};

export function VoiceTapeDeck({ energy, phase, progress, reducedMotion }: VoiceTapeDeckProps) {
  const heardPercent = Math.round(progress * 100);
  const tapeStyle = {
    "--heard": progress,
    "--energy": energy,
  } as CSSProperties;

  return (
    <figure className={`tape-deck tape-deck--${phase}`} style={tapeStyle}>
      <figcaption>
        <span>Voice tape / Maya</span>
        <strong>{heardPercent}% heard</strong>
      </figcaption>

      <svg
        className={reducedMotion ? "reduce-motion" : ""}
        viewBox="0 0 820 300"
        role="img"
        aria-label={`${heardPercent} percent of the current sentence has reached playback`}
      >
        <defs>
          <path id="tape-path" d="M 138 150 C 238 150, 266 216, 360 216 L 460 216 C 554 216, 582 150, 682 150" />
          <mask id="left-reel-holes">
            <rect width="820" height="300" fill="white" />
            {[0, 72, 144, 216, 288].map((angle) => (
              <rect
                key={angle}
                x="124"
                y="82"
                width="28"
                height="46"
                rx="10"
                fill="black"
                transform={`rotate(${angle} 138 150)`}
              />
            ))}
          </mask>
          <mask id="right-reel-holes">
            <rect width="820" height="300" fill="white" />
            {[0, 72, 144, 216, 288].map((angle) => (
              <rect
                key={angle}
                x="668"
                y="82"
                width="28"
                height="46"
                rx="10"
                fill="black"
                transform={`rotate(${angle} 682 150)`}
              />
            ))}
          </mask>
        </defs>

        <g className="deck-reel deck-reel--left">
          <circle cx="138" cy="150" r="92" className="reel-body" mask="url(#left-reel-holes)" />
          <circle cx="138" cy="150" r="30" className="reel-hub" />
          <circle cx="138" cy="150" r="7" className="reel-pin" />
        </g>

        <g className="deck-reel deck-reel--right">
          <circle cx="682" cy="150" r="92" className="reel-body" mask="url(#right-reel-holes)" />
          <circle cx="682" cy="150" r="30" className="reel-hub" />
          <circle cx="682" cy="150" r="7" className="reel-pin" />
        </g>

        <use href="#tape-path" className="tape-line tape-line--waiting" pathLength="1" />
        <use href="#tape-path" className="tape-line tape-line--heard" pathLength="1" />

        <g className="playhead">
          <rect x="374" y="191" width="72" height="70" rx="8" className="playhead-body" />
          <rect x="399" y="178" width="22" height="72" rx="4" className="playhead-slot" />
          <line x1="410" y1="174" x2="410" y2="262" className="playhead-line" />
        </g>

        {phase === "interrupted" ? (
          <g className="tape-cut" aria-hidden="true">
            <path d="M 394 196 l 12 16 l -10 13" />
            <path d="M 426 196 l -12 16 l 10 13" />
            <text x="410" y="286" textAnchor="middle">CUT AT HEARD WORD</text>
          </g>
        ) : null}
      </svg>

      <div className="deck-readout" aria-hidden="true">
        <span className="level-bar" />
        <span className="level-bar" />
        <span className="level-bar" />
        <span className="level-bar" />
        <span className="level-bar" />
      </div>
    </figure>
  );
}

export function VoiceRibbon({ active = false }: { active?: boolean }) {
  return (
    <svg
      className={`voice-ribbon ${active ? "active" : ""}`}
      viewBox="0 0 600 130"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      {Array.from({ length: 13 }, (_, row) => {
        const path = Array.from({ length: 101 }, (_, n) => {
          const x = n * 6;
          const envelope = Math.sin((Math.PI * n) / 100) ** 2;
          const y =
            65 + Math.sin(n / 10 + row * 0.22) * envelope * (14 + row * 3.1);
          return `${n ? "L" : "M"}${x},${y.toFixed(2)}`;
        }).join(" ");
        return (
          <path
            key={row}
            d={path}
            stroke={row < 6 ? "#b6a3ff" : "#f4b5c5"}
            strokeWidth="1.5"
            opacity={0.3 + row * 0.045}
            style={{ animationDelay: `${row * 45}ms` }}
          />
        );
      })}
    </svg>
  );
}

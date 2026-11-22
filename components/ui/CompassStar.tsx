// The master symbol: 8-point compass star in a ring (vision §7). Stub drawing for M1.
const points = Array.from({ length: 16 }, (_, k) => {
  const angle = (k * Math.PI) / 8 - Math.PI / 2;
  const radius = k % 4 === 0 ? 46 : k % 2 === 0 ? 28 : 11;
  return `${(50 + radius * Math.cos(angle)).toFixed(2)},${(50 + radius * Math.sin(angle)).toFixed(2)}`;
}).join(" ");

export default function CompassStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden focusable="false">
      <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <polygon points={points} fill="currentColor" />
    </svg>
  );
}

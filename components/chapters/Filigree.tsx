// Thin ornamental rule for the name mark: tapering hairlines, a hollow diamond, small beads.
export default function Filigree({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 24" aria-hidden focusable="false">
      <path d="M10 12 H128 M192 12 H310" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path d="M128 12 C134 4 142 4 146 12 C142 20 134 20 128 12 Z M192 12 C186 4 178 4 174 12 C178 20 186 20 192 12 Z" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <polygon points="160,3 169,12 160,21 151,12" fill="none" stroke="currentColor" strokeWidth="1" />
      <polygon points="160,8 164,12 160,16 156,12" fill="currentColor" />
      <circle cx="10" cy="12" r="1.6" fill="currentColor" />
      <circle cx="310" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

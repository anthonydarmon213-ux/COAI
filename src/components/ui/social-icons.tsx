export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="5.5" width="20" height="13" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.5 9.3v5.4l4.8-2.7-4.8-2.7Z" fill="currentColor" />
    </svg>
  );
}

export function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="7.2" cy="8" r="1.15" fill="currentColor" />
      <path d="M7.2 11v6.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M11.3 17.2V11m0 0c0-1.1.9-2 2.4-2 1.6 0 2.5.9 2.5 2.6v5.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

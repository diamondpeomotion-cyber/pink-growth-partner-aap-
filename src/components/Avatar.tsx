import { useState } from 'react';

interface AvatarProps {
  /** Image source. May be empty, undefined or a URL that fails to load. */
  src?: string | null;
  /** Full name, used to derive the initials fallback. */
  name?: string;
  /** Extra classes for the wrapper (size, ring, etc.). */
  className?: string;
  /** Font size class for the initials fallback. */
  textClassName?: string;
  alt?: string;
}

function initialsOf(name?: string): string {
  if (!name) return 'NX';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NX';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Avatar that degrades gracefully.
 *
 * Raw <img> tags were used across the dashboard with remote URLs. When one of
 * those failed to load (offline, expired CDN link, blocked host) the browser
 * showed a broken-image icon with the alt text spilling out of its rounded
 * container. This renders branded initials instead.
 */
export default function Avatar({
  src,
  name,
  className = 'w-10 h-10',
  textClassName = 'text-sm',
  alt,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={`relative overflow-hidden rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${className}`}
    >
      {showImage ? (
        <img
          src={src as string}
          alt={alt ?? name ?? 'Profile photo'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={`font-black text-primary select-none ${textClassName}`}>
          {initialsOf(name)}
        </span>
      )}
    </div>
  );
}

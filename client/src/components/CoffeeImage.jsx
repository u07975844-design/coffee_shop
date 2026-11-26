import { useState } from 'react';
import { Coffee } from 'lucide-react';
import { resolveMediaUrl } from '../api/axiosClient.js';

export default function CoffeeImage({ src, alt, className = '', fallbackTitle }) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaUrl(src);

  if (!resolved || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F3ECE1] via-[#EAE0D0] to-[#DFD0BA] text-[#6E5A4F] ${className}`}
        role="img"
        aria-label={alt || fallbackTitle || 'Specialty coffee'}
      >
        <Coffee className="h-8 w-8 opacity-65" />
        {fallbackTitle && (
          <span className="mt-2 px-4 text-center text-xs font-medium tracking-wide opacity-80">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

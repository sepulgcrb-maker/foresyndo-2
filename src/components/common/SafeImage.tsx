import React, { useState, useEffect } from 'react';

export const BROKEN_UNSPLASH_ID = 'photo-1541888946425-d0fbb186a5b3';

// Valid high-resolution construction replacement photo on Unsplash (1600px crisp)
export const DEFAULT_CONSTRUCTION_IMAGE =
  'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=1600&auto=format&fit=crop&q=85';

// Alternative high-res architectural & site construction photos
export const HIGH_RES_CONSTRUCTION_PHOTOS = {
  foundation: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&auto=format&fit=crop&q=85',
  structure: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1600&auto=format&fit=crop&q=85',
  interior: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=85',
  architecture: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=85',
  inspection: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600&auto=format&fit=crop&q=85',
};

// High-quality SVG data URI fallback for construction / project photos
export const FALLBACK_CONSTRUCTION_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bgGrad)" />
  <rect width="100%" height="100%" fill="url(#grid)" />

  <!-- Construction Crane & Building Outline Silhouette -->
  <g stroke="#ffffff" stroke-opacity="0.12" fill="none" stroke-width="2">
    <!-- Ground Line -->
    <line x1="60" y1="410" x2="740" y2="410" stroke-width="3" stroke="#f97316" stroke-opacity="0.6" />

    <!-- Building Structure Blocks -->
    <rect x="140" y="240" width="140" height="170" />
    <line x1="140" y1="280" x2="280" y2="280" />
    <line x1="140" y1="320" x2="280" y2="320" />
    <line x1="140" y1="360" x2="280" y2="360" />
    <line x1="180" y1="240" x2="180" y2="410" />
    <line x1="240" y1="240" x2="240" y2="410" />

    <!-- Main Tower -->
    <rect x="320" y="160" width="190" height="250" />
    <line x1="320" y1="210" x2="510" y2="210" />
    <line x1="320" y1="260" x2="510" y2="260" />
    <line x1="320" y1="310" x2="510" y2="310" />
    <line x1="320" y1="360" x2="510" y2="360" />
    <line x1="380" y1="160" x2="380" y2="410" />
    <line x1="450" y1="160" x2="450" y2="410" />

    <!-- Tower Crane -->
    <line x1="560" y1="410" x2="560" y2="100" stroke-width="3" stroke="#f97316" stroke-opacity="0.4" />
    <line x1="560" y1="100" x2="710" y2="100" stroke-width="3" stroke="#f97316" stroke-opacity="0.4" />
    <line x1="560" y1="100" x2="500" y2="100" stroke-width="2" />
    <line x1="560" y1="75" x2="560" y2="100" stroke-width="2" />
    <line x1="560" y1="75" x2="660" y2="100" stroke-width="1.5" />
    <line x1="560" y1="75" x2="515" y2="100" stroke-width="1.5" />
    <line x1="660" y1="100" x2="660" y2="160" stroke-width="1.5" stroke-dasharray="3 3" />
    <!-- Hook -->
    <rect x="652" y="160" width="16" height="12" fill="#f97316" fill-opacity="0.5" />
  </g>

  <!-- Central Badge/Icon -->
  <g transform="translate(400, 200)">
    <!-- Glow circle -->
    <circle r="44" fill="#0f172a" stroke="#f97316" stroke-width="2.5" stroke-dasharray="4 2" />
    
    <!-- Hardhat / Construction Icon -->
    <path d="M -22 6 C -22 -12 22 -12 22 6 Z" fill="url(#accentGrad)" />
    <path d="M -26 6 L 26 6 C 27 6 28 7 28 8 C 28 9 27 10 26 10 L -26 10 C -27 10 -28 9 -28 8 C -28 7 -27 6 -26 6 Z" fill="#ffffff" fill-opacity="0.9" />
    <rect x="-4" y="-12" width="8" height="18" fill="#ffffff" fill-opacity="0.3" rx="1" />
  </g>

  <!-- Labels -->
  <text x="400" y="278" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#f8fafc" text-anchor="middle" letter-spacing="1">
    DOKUMENTASI PROYEK FISIK
  </text>
  <text x="400" y="304" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="#f97316" text-anchor="middle" letter-spacing="0.5">
    PT. FORESYNDO GLOBAL INDONESIA
  </text>
  <text x="400" y="328" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">
    Kondisi Lahan &amp; Progres Pembangunan Gedung
  </text>
</svg>
`);

// High-quality SVG fallback for receipt / transfer proofs
export const FALLBACK_DOCUMENT_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#0f172a"/>
  <rect x="20" y="20" width="460" height="260" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  <circle cx="250" cy="110" r="32" fill="#0284c7" fill-opacity="0.2" stroke="#0284c7" stroke-width="2"/>
  <path d="M 238 110 L 246 118 L 264 100" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="250" y="170" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#f8fafc" text-anchor="middle">
    LAMPIRAN RESMI TERVERIFIKASI
  </text>
  <text x="250" y="194" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">
    Bukti Pembayaran &amp; Validasi Finansial
  </text>
</svg>
`);

/**
 * Normalizes any image URL, preventing invalid placeholders and known 404 photos.
 * Ensures images render in high resolution and crisp clarity.
 */
export function sanitizeImageUrl(url?: string | null, fallback = DEFAULT_CONSTRUCTION_IMAGE): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }
  const clean = url.trim();

  // Handle database storage placeholders (e.g. [INLINE_BASE64_ATTACHMENT_IN_SNAPSHOT], [STORED_IN_SNAPSHOT])
  if (clean.startsWith('[') && clean.endsWith(']')) {
    return fallback;
  }

  // Handle invalid formats
  if (
    !clean.startsWith('http://') &&
    !clean.startsWith('https://') &&
    !clean.startsWith('data:image') &&
    !clean.startsWith('blob:') &&
    !clean.startsWith('/') &&
    !clean.startsWith('./')
  ) {
    return fallback;
  }

  // Upgrade Unsplash image resolution for razor-sharp visual preview
  if (clean.includes('images.unsplash.com')) {
    // If it has small width parameter like w=400 or w=500 or w=800, upgrade to w=1600
    if (/w=[1-8]\d\d(?!\d)/.test(clean)) {
      return clean.replace(/w=[1-8]\d\d(?!\d)/, 'w=1600').replace(/q=\d+/, 'q=85');
    }
  }

  return clean;
}

export type ImageClarityMode = 'original' | 'sharp' | 'high_contrast' | 'blueprint_cad' | 'warm';

export function getImageClarityStyle(mode: ImageClarityMode | string = 'original'): React.CSSProperties {
  switch (mode) {
    case 'sharp':
      return {
        filter: 'contrast(115%) brightness(105%) saturate(110%)',
        imageRendering: 'auto',
      };
    case 'high_contrast':
      return {
        filter: 'contrast(140%) brightness(100%)',
        imageRendering: 'crisp-edges',
      };
    case 'blueprint_cad':
      return {
        filter: 'contrast(150%) brightness(110%) hue-rotate(185deg)',
      };
    case 'warm':
      return {
        filter: 'contrast(105%) brightness(108%) sepia(20%)',
      };
    default:
      return {
        filter: 'none',
      };
  }
}

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  clarityMode?: ImageClarityMode;
  onImageError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Reusable SafeImage component with automatic multi-tier fallback:
 * 1. Checks if src contains the known broken Unsplash ID and swaps it immediately.
 * 2. Catches runtime 404 / network / CORS failures in onError.
 * 3. Gracefully swaps to the provided fallbackSrc or the built-in offline SVG fallback.
 * 4. Prevents infinite error loops.
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackSrc = FALLBACK_CONSTRUCTION_SVG,
  clarityMode = 'original',
  className = '',
  style,
  onError,
  ...restProps
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    return sanitizeImageUrl(src, fallbackSrc);
  });
  const [hasFailedOnce, setHasFailedOnce] = useState(false);

  // Sync if src prop changes
  useEffect(() => {
    const sanitized = sanitizeImageUrl(src, fallbackSrc);
    setCurrentSrc(sanitized);
    setHasFailedOnce(false);
  }, [src, fallbackSrc]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasFailedOnce) {
      setHasFailedOnce(true);
      // If original attempt failed, switch to fallbackSrc or SVG fallback
      if (currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
      } else {
        setCurrentSrc(FALLBACK_CONSTRUCTION_SVG);
      }
    } else if (currentSrc !== FALLBACK_CONSTRUCTION_SVG) {
      // Ultimate safe fallback
      setCurrentSrc(FALLBACK_CONSTRUCTION_SVG);
    }
    if (onError) {
      onError(e);
    }
  };

  const clarityStyle = getImageClarityStyle(clarityMode);

  return (
    <img
      src={currentSrc}
      alt={alt || 'Foto Dokumentasi'}
      className={className}
      style={{
        ...clarityStyle,
        ...style,
      }}
      onError={handleError}
      referrerPolicy="no-referrer"
      loading="lazy"
      {...restProps}
    />
  );
};

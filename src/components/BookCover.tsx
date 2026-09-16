import React, { useState } from 'react';

interface BookCoverProps {
  bookNumber: number;
  className?: string;
  altTitle?: string;
}

interface BookTheme {
  image?: string;
  fallbackImage?: string;
  name: string;
  accentHex: string;
  gradientStart: string;
  gradientEnd: string;
  waveColor: string;
  puzzleTint: string;
  numberColor: string;
}

const BOOK_THEMES: Record<number, BookTheme> = {
  1: {
    image: '/images/books/book-1-opt.jpg',
    fallbackImage: '/images/books/book-1.jpeg',
    name: 'Book 1',
    accentHex: '#16a34a',
    gradientStart: '#15803d',
    gradientEnd: '#166534',
    waveColor: '#22c55e',
    puzzleTint: '#ca8a04',
    numberColor: '#dc2626',
  },
  2: {
    image: '/images/books/book-2-opt.jpg',
    fallbackImage: '/images/books/book-2.jpeg',
    name: 'Book 2',
    accentHex: '#ea580c',
    gradientStart: '#ea580c',
    gradientEnd: '#9a3412',
    waveColor: '#f97316',
    puzzleTint: '#ca8a04',
    numberColor: '#dc2626',
  },
  3: {
    image: '/images/books/book-3-opt.jpg',
    fallbackImage: '/images/books/book-3.jpeg',
    name: 'Book 3',
    accentHex: '#0284c7',
    gradientStart: '#0284c7',
    gradientEnd: '#075985',
    waveColor: '#38bdf8',
    puzzleTint: '#ca8a04',
    numberColor: '#dc2626',
  },
  4: {
    image: '/images/books/book-4-opt.jpg',
    fallbackImage: '/images/books/book-4.jpeg',
    name: 'Book 4',
    accentHex: '#7c3aed',
    gradientStart: '#7c3aed',
    gradientEnd: '#5b21b6',
    waveColor: '#a855f7',
    puzzleTint: '#ca8a04',
    numberColor: '#dc2626',
  },
  5: {
    image: '/images/books/book-5-opt.jpg',
    fallbackImage: '/images/books/book-5.jpeg',
    name: 'Book 5',
    accentHex: '#e11d48',
    gradientStart: '#e11d48',
    gradientEnd: '#9f1239',
    waveColor: '#fb7185',
    puzzleTint: '#ca8a04',
    numberColor: '#dc2626',
  },
  6: {
    image: '/images/books/book-6-opt.jpg',
    fallbackImage: '/images/books/book-6.jpeg',
    name: 'Book 6',
    accentHex: '#d97706',
    gradientStart: '#d97706',
    gradientEnd: '#92400e',
    waveColor: '#f59e0b',
    puzzleTint: '#ca8a04',
    numberColor: '#dc2626',
  },
};

export const BookCover: React.FC<BookCoverProps> = ({
  bookNumber,
  className = '',
  altTitle
}) => {
  const theme = BOOK_THEMES[bookNumber] || BOOK_THEMES[1];
  const [imageError, setImageError] = useState<boolean>(false);
  const [triedFallback, setTriedFallback] = useState<boolean>(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(theme.image);

  const handleImageError = () => {
    if (!triedFallback && theme.fallbackImage && currentSrc !== theme.fallbackImage) {
      setTriedFallback(true);
      setCurrentSrc(theme.fallbackImage);
    } else {
      setImageError(true);
    }
  };

  return (
    <div
      className={`relative w-full aspect-[1/1.37] rounded-lg overflow-hidden select-none bg-slate-900 shadow-md ${className}`}
    >
      {/* 1. Real Image if loaded successfully */}
      {currentSrc && !imageError ? (
        <img
          src={currentSrc}
          alt={altTitle || `4000 Essential English Words ${bookNumber}`}
          onError={handleImageError}
          className="w-full h-full object-cover transition-transform duration-300"
          loading="lazy"
        />
      ) : (
        /* 2. Procedural SVG Cover matching Compass Publishing design */
        <svg
          viewBox="0 0 300 410"
          className="w-full h-full"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`bgGrad-${bookNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.waveColor} />
              <stop offset="50%" stopColor={theme.gradientStart} />
              <stop offset="100%" stopColor={theme.gradientEnd} />
            </linearGradient>

            <linearGradient id={`goldGrad-${bookNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>

            {/* Subtle puzzle pattern simulation */}
            <pattern id={`puzzlePattern-${bookNumber}`} width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 0 25 Q 12 18 25 25 Q 38 32 50 25 M 25 0 Q 32 12 25 25 Q 18 38 25 50"
                fill="none"
                stroke="#78350f"
                strokeWidth="1.2"
                opacity="0.35"
              />
            </pattern>
          </defs>

          {/* Right-side Golden Puzzle Background */}
          <rect width="300" height="410" fill={`url(#goldGrad-${bookNumber})`} />
          <rect width="300" height="410" fill={`url(#puzzlePattern-${bookNumber})`} />

          {/* Left-to-Center Dynamic Curved Wave in Book Signature Color */}
          <path
            d="M 0,0 L 225,0 C 235,130 145,210 215,410 L 0,410 Z"
            fill={`url(#bgGrad-${bookNumber})`}
          />

          {/* Curved Light Wave Trim Accent */}
          <path
            d="M 225,0 C 235,130 145,210 215,410"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            opacity="0.75"
          />

          {/* Compass ELT Vocabulary Badge (Top Right) */}
          <g transform="translate(255, 36)">
            <circle r="22" fill="#ffffff" stroke="#1d4ed8" strokeWidth="2.5" />
            <circle r="19" fill="#1e3a8a" opacity="0.1" />
            <text
              y="-7"
              textAnchor="middle"
              fontSize="6"
              fontWeight="900"
              fill="#1e3a8a"
              letterSpacing="0.5"
            >
              COMPASS ELT
            </text>
            <path
              d="M -6,4 L 0,-6 L 6,4 L -4,-2 L 4,-2 Z"
              fill="#dc2626"
            />
            <text
              y="11"
              textAnchor="middle"
              fontSize="5"
              fontWeight="800"
              fill="#dc2626"
              letterSpacing="0.5"
            >
              VOCABULARY
            </text>
          </g>

          {/* Title: 4000 */}
          <text
            x="24"
            y="96"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize="64"
            fontWeight="900"
            fill="#ffffff"
            stroke={theme.gradientEnd}
            strokeWidth="3.5"
            paintOrder="stroke fill"
          >
            4000
          </text>

          {/* Title: Essential (Vibrant Yellow) */}
          <text
            x="24"
            y="144"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize="38"
            fontWeight="900"
            fill="#facc15"
            filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.4))"
          >
            Essential
          </text>

          {/* Title: English */}
          <text
            x="24"
            y="196"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize="44"
            fontWeight="900"
            fill="#ffffff"
            filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))"
          >
            English
          </text>

          {/* Title: Words */}
          <text
            x="24"
            y="246"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize="44"
            fontWeight="900"
            fill="#ffffff"
            filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))"
          >
            Words
          </text>

          {/* Giant 3D Book Number (Bottom Left) */}
          <g transform="translate(24, 386)">
            {/* 3D Depth Shadow */}
            <text
              x="2"
              y="2"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
              fontSize="90"
              fontWeight="900"
              fill="#7f1d1d"
            >
              {bookNumber}
            </text>
            {/* Front Bevel */}
            <text
              x="0"
              y="0"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
              fontSize="90"
              fontWeight="900"
              fill={theme.numberColor}
              stroke="#fca5a5"
              strokeWidth="1.5"
            >
              {bookNumber}
            </text>
          </g>

          {/* Author: Paul Nation */}
          <text
            x="96"
            y="378"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
            fontSize="14"
            fontWeight="800"
            fill="#0f172a"
            letterSpacing="3"
          >
            Paul Nation
          </text>
        </svg>
      )}

      {/* Realistic 3D Book Spine Effect: Left shadow & spine crease */}
      <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/45 via-white/20 to-transparent pointer-events-none" />
      {/* Right Edge: Page edge thickness hint */}
      <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/25 to-transparent pointer-events-none" />
      {/* Subtle glossy sheen gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      {/* Protective border ring */}
      <div className="absolute inset-0 ring-1 ring-inset ring-black/15 dark:ring-white/10 rounded-lg pointer-events-none" />
    </div>
  );
};

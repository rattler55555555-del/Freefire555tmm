import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  fallbackSrc?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  showLoader?: boolean;
}

// Default Arena Khel official logo
const ARENA_KHEL_LOGO = "/arena_khel_logo.png";

// In-memory cache of already resolved image URLs across component mounts
const loadedImagesCache = new Set<string>();

export default function SafeImage({ 
  src, 
  alt = "Arena Khel", 
  className = "", 
  imgClassName = "",
  fallbackSrc = ARENA_KHEL_LOGO,
  objectFit = 'cover',
  showLoader = true
}: SafeImageProps) {
  // If the image was previously cached/loaded, start with isLoading = false to prevent UI flicker
  const isPreCached = src ? loadedImagesCache.has(src) : false;
  const [isLoading, setIsLoading] = useState(!isPreCached);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src || fallbackSrc);

  useEffect(() => {
    if (!src) {
      setError(true);
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
      return;
    }

    if (loadedImagesCache.has(src)) {
      setIsLoading(false);
      setError(false);
      setCurrentSrc(src);
      return;
    }

    setIsLoading(true);
    setError(false);
    setCurrentSrc(src);

    // Preload image in memory
    const preloader = new Image();
    preloader.src = src;
    preloader.onload = () => {
      loadedImagesCache.add(src);
      setIsLoading(false);
    };
    preloader.onerror = () => {
      setError(true);
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
    };

    return () => {
      preloader.onload = null;
      preloader.onerror = null;
    };
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!error) {
      setError(true);
      setCurrentSrc(fallbackSrc);
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    if (src) loadedImagesCache.add(src);
    setIsLoading(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background / Smooth Placeholder during initial lazy loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#09152b] flex flex-col items-center justify-center p-4 z-0">
          <img 
            src={ARENA_KHEL_LOGO} 
            alt="Arena Khel Logo Placeholder" 
            className="w-12 h-12 object-contain opacity-25 grayscale animate-pulse"
          />
          {showLoader && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs">
              <Loader2 className="text-cyan-500 animate-spin" size={18} />
            </div>
          )}
        </div>
      )}

      {/* Main Image with Lazy Loading & Memory Caching */}
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-${objectFit} relative z-10 transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${imgClassName}`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

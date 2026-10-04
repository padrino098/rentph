import React, { useState } from 'react';
import { Home } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackTitle?: string;
  className?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Property view',
  fallbackTitle,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className={`relative flex flex-col items-center justify-center bg-stone-100 text-stone-500 overflow-hidden ${className}`}>
        <Home className="w-8 h-8 text-stone-400 mb-1" />
        <span className="text-xs text-stone-500 font-medium px-2 text-center truncate max-w-full">
          {fallbackTitle || alt || 'Aura Sanctuary'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      {...props}
    />
  );
};

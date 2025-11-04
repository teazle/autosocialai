'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { X, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  alt?: string;
  images?: string[]; // Optional array for gallery navigation
  currentIndex?: number; // Current index in gallery
  onIndexChange?: (index: number) => void; // Callback when navigating gallery
}

export function ImageViewer({ 
  open, 
  onOpenChange, 
  imageUrl, 
  alt = 'Image',
  images,
  currentIndex = 0,
  onIndexChange
}: ImageViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get current image URL (from gallery array or single image)
  const currentImageUrl = images && images.length > 0 
    ? images[currentIndex] 
    : imageUrl;

  // Reset state when dialog opens/closes or image changes
  useEffect(() => {
    if (open && currentImageUrl) {
      setLoading(true);
      setError(false);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [open, currentImageUrl]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(5, prev + 0.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.5));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on ESC
      if (e.key === 'Escape') {
        onOpenChange(false);
        return;
      }

      // Gallery navigation with arrow keys
      if (images && images.length > 1 && onIndexChange) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
          onIndexChange(newIndex);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
          onIndexChange(newIndex);
        }
      }

      // Zoom with +/- keys
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, images, currentIndex, onIndexChange, onOpenChange, handleZoomIn, handleZoomOut]);

  // Mouse wheel zoom
  useEffect(() => {
    if (!open || !containerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.max(0.5, Math.min(5, prev + delta)));
      }
    };

    const container = containerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [open]);

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  if (!currentImageUrl) return null;

  const canNavigateLeft = images && images.length > 1 && currentIndex > 0;
  const canNavigateRight = images && images.length > 1 && currentIndex < images.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-7xl w-full p-0 bg-white/95 backdrop-blur-sm border-none animate-in fade-in-0 zoom-in-95 duration-200"
      >
        <div 
          ref={containerRef}
          className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Close Button */}
          <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 p-2 text-gray-900 transition-all hover:scale-110">
            <X className="w-5 h-5" />
            <span className="sr-only">Close image viewer</span>
          </DialogClose>

          {/* Zoom Controls */}
          <div className="absolute right-4 top-20 z-50 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 text-gray-900 h-10 w-10"
              disabled={scale >= 5}
              title="Zoom in (Ctrl + Plus)"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 text-gray-900 h-10 w-10"
              disabled={scale <= 0.5}
              title="Zoom out (Ctrl + Minus)"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            {scale !== 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetZoom}
                className="rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 text-gray-900 h-10 w-10 text-xs"
                title="Reset zoom"
              >
                1:1
              </Button>
            )}
          </div>

          {/* Gallery Navigation */}
          {images && images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => canNavigateLeft && onIndexChange?.(currentIndex - 1)}
                disabled={!canNavigateLeft}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 text-gray-900 h-12 w-12 disabled:opacity-30"
                title="Previous image (←)"
              >
                ←
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => canNavigateRight && onIndexChange?.(currentIndex + 1)}
                disabled={!canNavigateRight}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 text-gray-900 h-12 w-12 disabled:opacity-30"
                title="Next image (→)"
              >
                →
              </Button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 shadow-lg border border-gray-200 text-gray-900 px-4 py-2 rounded-full text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Loading State */}
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center z-40">
              <Loader2 className="w-8 h-8 text-gray-900 animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-40">
              <div className="text-gray-900 text-center">
                <p className="text-lg mb-2">Failed to load image</p>
                <p className="text-sm text-black">The image may have been moved or deleted</p>
              </div>
            </div>
          )}

          {/* Image */}
          {!error && (
            <img
              ref={imageRef}
              src={currentImageUrl}
              alt={alt}
              key={currentImageUrl}
              className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
                loading ? 'opacity-0' : 'opacity-100'
              } ${isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'}`}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              draggable={false}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


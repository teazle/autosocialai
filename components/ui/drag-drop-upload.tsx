'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DragDropUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  maxSizeMB?: number; // in MB (alternative to maxSize)
  uploading?: boolean;
  currentFileUrl?: string | null;
  label?: string;
  description?: string;
  className?: string;
}

export function DragDropUpload({
  onFileSelect,
  accept,
  maxSize,
  maxSizeMB = 10,
  uploading = false,
  currentFileUrl,
  label = 'Upload File',
  description,
  className,
}: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxFileSize = maxSize || maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file size
    if (file.size > maxFileSize) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return false;
    }

    // Check file type if accept is specified
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          // Extension check
          return fileName.endsWith(type.toLowerCase());
        } else if (type.includes('/*')) {
          // MIME type wildcard (e.g., image/*)
          const baseType = type.split('/')[0];
          return fileType.startsWith(baseType + '/');
        } else {
          // Exact MIME type
          return fileType === type;
        }
      });

      if (!isAccepted) {
        setError(`Invalid file type. Accepted: ${accept}`);
        return false;
      }
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50',
          uploading && 'opacity-50 cursor-not-allowed',
          error && 'border-red-300 bg-red-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Uploading...</p>
            </>
          ) : currentFileUrl ? (
            <>
              <File className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-sm text-gray-700 font-medium">File uploaded</p>
              <p className="text-xs text-gray-500 mt-1">Click to replace</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-700 font-medium">
                Drag and drop a file here, or click to browse
              </p>
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="mt-2 text-sm text-red-600 text-center">{error}</div>
        )}
      </div>

      {currentFileUrl && !uploading && (
        <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-sm">
          <span className="text-green-700">File uploaded successfully</span>
          <a
            href={currentFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View file
          </a>
        </div>
      )}
    </div>
  );
}


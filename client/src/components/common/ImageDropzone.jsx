import React, { useState, useRef } from 'react';
import articleService from '../../services/articleService';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
} from 'lucide-react';

function getDisplayUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const apiBase =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

const ALLOWED_EXTENSIONS = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Megabytes

export default function ImageDropzone({
  value = '',
  onChange,
  label = 'Cover Image Asset',
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = async (file) => {
    if (!file) return;

    // Validate mime type
    if (!ALLOWED_EXTENSIONS.includes(file.type)) {
      setError('Only JPG, JPEG, PNG, and WEBP formats are accepted.');
      return;
    }

    // Validate size (5MB max)
    if (file.size > MAX_FILE_SIZE) {
      setError('Image file exceeds the 5MB institutional limit.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(30);

      // Simulated initial progress tick
      const progressTimer = setTimeout(() => {
        setUploadProgress(70);
      }, 200);

      const res = await articleService.uploadImage(file);
      clearTimeout(progressTimer);
      setUploadProgress(100);

      const uploadedUrl = res.url || res.data?.url;
      if (uploadedUrl) {
        if (onChange) onChange(uploadedUrl);
      } else {
        throw new Error('Upload succeeded but server did not return image URL.');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to upload image. Please verify file integrity and try again.'
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleRemove = () => {
    if (onChange) onChange('');
    setError(null);
  };

  const handleApplyUrl = (e) => {
    e.preventDefault();
    if (urlInputValue.trim()) {
      if (onChange) onChange(urlInputValue.trim());
      setUrlInputValue('');
      setShowUrlFallback(false);
      setError(null);
    }
  };

  return (
    <div className={`space-y-2 font-serif ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-serif font-bold uppercase tracking-wider text-gray-700">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setShowUrlFallback(!showUrlFallback)}
            className="text-[11px] font-serif text-mcc-maroon hover:underline flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlFallback ? 'Hide URL Input' : 'Enter Image URL directly'}</span>
          </button>
        </div>
      )}

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-2.5 rounded bg-red-50 border-l-4 border-red-700 text-red-900 text-xs font-serif flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-gray-500 hover:text-gray-800 text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* EXTERNAL URL FALLBACK INPUT */}
      {showUrlFallback && (
        <form onSubmit={handleApplyUrl} className="flex gap-2">
          <input
            type="url"
            value={urlInputValue}
            onChange={(e) => setUrlInputValue(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="flex-1 px-3 py-1.5 text-xs font-sans border border-gray-300 rounded focus:ring-1 focus:ring-mcc-maroon focus:border-mcc-maroon"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-mcc-maroon text-white text-xs font-serif font-bold rounded hover:bg-mcc-maroon-dark transition-colors"
          >
            Set URL
          </button>
        </form>
      )}

      {/* DROPZONE TARGET OR ACTIVE IMAGE PREVIEW */}
      {value ? (
        /* 1. ACTIVE PREVIEW STATE */
        <div className="relative rounded-md border-2 border-gray-200 overflow-hidden bg-gray-50 group">
          <div className="h-44 w-full overflow-hidden bg-gray-100 flex items-center justify-center">
            <img
              src={getDisplayUrl(value)}
              alt="Asset Preview"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/mcc-campus-hero.jpg';
              }}
            />
          </div>

          {/* Action Bar overlay */}
          <div className="p-2.5 bg-white border-t border-gray-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 truncate max-w-xs font-sans text-[11px]">
              <ImageIcon className="w-3.5 h-3.5 text-mcc-gold shrink-0" />
              <span className="truncate">{value}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-xs font-serif font-semibold text-mcc-maroon hover:bg-mcc-maroon/10 rounded transition-colors"
              >
                Change Image
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-2 py-1 text-xs font-serif font-semibold text-red-700 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 2. DROPZONE TARGET (EMPTY OR UPLOADING) */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-mcc-maroon bg-mcc-maroon/5 ring-2 ring-mcc-maroon/20'
              : 'border-gray-300 hover:border-mcc-maroon/60 bg-mcc-halfwhite/40 hover:bg-mcc-halfwhite'
          }`}
        >
          {uploading ? (
            <div className="py-3 space-y-3">
              <RefreshCw className="w-8 h-8 text-mcc-maroon mx-auto animate-spin" />
              <p className="text-xs font-serif font-bold text-gray-800">
                Transmitting image asset to collegiate archive...
              </p>
              {/* Progress Bar */}
              <div className="w-48 mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-mcc-maroon transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-2">
              <div className="w-12 h-12 rounded-full bg-mcc-maroon/10 text-mcc-maroon mx-auto flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-serif font-bold text-gray-800">
                  Drag image here or click to browse
                </p>
                <p className="text-[11px] font-sans text-gray-500 mt-0.5">
                  Supports JPG, PNG, WEBP formats up to 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

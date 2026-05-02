import { useRef, useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';

/**
 * ImageUpload — reusable component for uploading employee avatars or company logos.
 *
 * Props:
 *  - currentImage: string | null — existing image URL or data URI
 *  - onUpload: (dataUrl: string) => void — callback with base64 data
 *  - onRemove: () => void — callback when image is removed
 *  - size: 'sm' | 'md' | 'lg' — avatar size
 *  - shape: 'circle' | 'square' — circle for avatars, square for logos
 *  - initials: string — fallback text when no image
 *  - disabled: boolean
 */
const SIZES = {
  sm: { container: 'w-10 h-10',  text: 'text-xs',  icon: 12 },
  md: { container: 'w-16 h-16',  text: 'text-lg',  icon: 16 },
  lg: { container: 'w-24 h-24',  text: 'text-2xl', icon: 20 },
};

const MAX_SIZE_KB = 200;

export default function ImageUpload({
  currentImage = null,
  onUpload,
  onRemove,
  size = 'md',
  shape = 'circle',
  initials = 'EP',
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');
  const s = SIZES[size];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    // Validate type
    if (!file.type.startsWith('image/')) {
      return setError('Only image files are allowed.');
    }

    // Validate size
    if (file.size > MAX_SIZE_KB * 1024) {
      return setError(`Image must be under ${MAX_SIZE_KB}KB. Compress before uploading.`);
    }

    // Read as data URL
    const reader = new FileReader();
    reader.onload = () => {
      onUpload?.(reader.result);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative group">
        {/* Image or initials fallback */}
        <div className={`${s.container} ${roundedClass} overflow-hidden flex items-center justify-center
          bg-gradient-to-br from-[#00B4D8] to-[#06D6A0] ring-2 ring-[#00B4D8]/20`}>
          {currentImage ? (
            <img src={currentImage} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className={`${s.text} font-bold text-[#0D1B2A]`}>{initials}</span>
          )}
        </div>

        {/* Hover overlay */}
        {!disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`absolute inset-0 ${roundedClass} bg-black/50 flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
          >
            <Camera size={s.icon} className="text-white" />
          </button>
        )}

        {/* Remove button */}
        {currentImage && !disabled && (
          <button
            type="button"
            onClick={() => { onRemove?.(); setError(''); }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B6B] rounded-full flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <X size={10} className="text-white" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload hint */}
      {!disabled && !currentImage && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-[10px] text-[#00B4D8] hover:underline"
        >
          <Upload size={10} /> Upload Photo
        </button>
      )}

      {error && <p className="text-[10px] text-[#FF6B6B] max-w-[120px] text-center">{error}</p>}
    </div>
  );
}

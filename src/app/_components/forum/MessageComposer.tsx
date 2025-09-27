import { useRef } from "react";

interface MessageComposerProps {
  message: string;
  imageFiles: File[];
  imagePreviews: string[];
  sending: boolean;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onImageSelect: (files: File[]) => void;
  onImageRemove: (index: number) => void;
  onImagePreview: (index: number) => void;
}

export default function MessageComposer({
  message,
  imageFiles,
  imagePreviews,
  sending,
  onMessageChange,
  onSubmit,
  onImageSelect,
  onImageRemove,
  onImagePreview,
}: MessageComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    if (chosen.length === 0) return;
    
    // Enforce max 5 images
    const room = Math.max(0, 5 - imageFiles.length);
    const toAdd = chosen.slice(0, room);
    
    if (toAdd.length < chosen.length) {
      alert("You can attach up to 5 images.");
    }
    
    onImageSelect(toAdd);
  };

  return (
    <>
      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="px-4 md:px-6 pt-4">
          <div className="flex gap-3 flex-wrap">
            {imagePreviews.map((src, idx) => (
              <div key={idx} className="relative bg-black/60 rounded-xl border border-white/10 p-2">
                <img
                  src={src}
                  alt={`selected-${idx}`}
                  className="h-16 w-16 object-cover rounded-lg cursor-pointer"
                  onClick={() => onImagePreview(idx)}
                />
                <button
                  type="button"
                  aria-label="Remove image"
                  title="Remove image"
                  onClick={() => onImageRemove(idx)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-white text-xs"
                  style={{
                    background: 'linear-gradient(135deg, #8a2be2, #ff00ff)',
                    boxShadow: '0 4px 20px rgba(255,0,255,0.25)'
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Composer Form */}
      <form onSubmit={onSubmit} className="p-4 md:p-6 border-t border-cyan-400/10">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          
          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
            className="px-4 py-3 rounded-xl font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #111, #1b1b2b)',
              border: '1px solid rgba(0,240,255,0.15)'
            }}
          >
            <div className="flex items-center gap-2">
              Upload
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M9 2a1 1 0 0 0-.894.553L7.382 4H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3h-2.382l-.724-1.447A1 1 0 0 0 12.999 2H9zM12 18a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
              </svg>
            </div>
          </button>
          
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            className="flex-1 bg-black/50 text-white rounded-xl px-4 py-3 outline-none"
            style={{ border: '1px solid rgba(0,240,255,0.15)' }}
          />
          
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #00f0ff, #8a2be2)',
              boxShadow: '0 4px 20px rgba(0,240,255,0.25)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,240,255,0.45)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,240,255,0.25)')}
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </>
  );
}
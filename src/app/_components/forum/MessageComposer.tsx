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
          <div className="text-xs text-[#6b7785] font-mono mb-2"># attached images:</div>
          <div className="flex gap-3 flex-wrap">
            {imagePreviews.map((src, idx) => (
              <div key={idx} className="relative bg-[rgba(0,0,0,0.7)] rounded border border-[rgba(0,240,255,0.2)] p-2">
                <img
                  src={src}
                  alt={`selected-${idx}`}
                  className="h-16 w-16 object-cover rounded cursor-pointer"
                  onClick={() => onImagePreview(idx)}
                />
                <button
                  type="button"
                  aria-label="Remove image"
                  title="Remove image"
                  onClick={() => onImageRemove(idx)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-white text-xs bg-[#ff5f56] hover:bg-[#ff3b30] transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Composer Form */}
      <form onSubmit={onSubmit} className="p-4 md:p-6 border-t border-[rgba(0,240,255,0.15)]">
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
            className="px-4 py-3 rounded border border-[rgba(0,240,255,0.2)] bg-[rgba(0,0,0,0.7)] text-[#00f0ff] font-mono text-sm transition-all hover:border-[rgba(0,240,255,0.4)] hover:bg-[rgba(0,240,255,0.05)]"
          >
            attach
          </button>

          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7785] font-mono text-sm pointer-events-none">$</span>
            <input
              type="text"
              placeholder="type message..."
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              className="w-full bg-[rgba(0,0,0,0.7)] text-[#e6f6ff] rounded border border-[rgba(0,240,255,0.2)] pl-8 pr-4 py-3 outline-none font-mono text-sm focus:border-[rgba(0,240,255,0.5)] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="px-6 py-3 rounded bg-[rgba(0,240,255,0.2)] border border-[rgba(0,240,255,0.3)] text-[#00f0ff] font-mono text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[rgba(0,240,255,0.3)] hover:border-[rgba(0,240,255,0.5)]"
          >
            {sending ? 'sending...' : 'send'}
          </button>
        </div>
      </form>
    </>
  );
}
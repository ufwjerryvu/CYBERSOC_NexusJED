import React from "react";
import MessageMenu from "./MessageMenu";
import type { Socket } from "socket.io-client";

interface MessageProps {
  message: {
    id: string;
    text: string;
    image?: string;
    images?: string[];
    email: string;
    username: string;
    admin_attr: boolean;
    ts: number;
  };
  currentUserEmail: string | null;
  isCurrentUserAdmin: boolean;
  editingMessageId: string | null;
  editingText: string;
  editingImages: string[];
  socket: Socket | null;
  onEditStart: (messageId: string, currentText: string) => void;
  onEditCancel: () => void;
  onEditSave: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onImageClick: (imageSrc: string) => void;
  setEditingText: (text: string) => void;
  setEditingImages: (images: string[]) => void;
}

export default function Message({
  message: m,
  currentUserEmail,
  isCurrentUserAdmin,
  editingMessageId,
  editingText,
  editingImages,
  socket,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDelete,
  onImageClick,
  setEditingText,
  setEditingImages,
}: MessageProps) {
  const handleImageRemove = async (imageIndex: number) => {
    // Update local editing state immediately
    setEditingImages(editingImages.filter((_, idx) => idx !== imageIndex));
    
    // Persist change to database
    if (editingMessageId) {
      try {
        await fetch(`/api/messages/${editingMessageId}`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            "x-user-email": currentUserEmail ?? ""
          },
          body: JSON.stringify({ 
            action: "remove-image", 
            imageIndex 
          })
        });
      } catch (error) {
        console.error("Failed to persist image removal:", error);
      }
    }
    
    // Emit real-time image removal to other users
    if (socket && editingMessageId) {
      socket.emit("message:image-removed", { 
        messageId: editingMessageId, 
        imageIndex 
      });
    }
  };

  const imgs = (m.images && m.images.length > 0) ? m.images : (m.image ? [m.image] : []);

  return (
    <div
      data-message-id={m.id}
      className="px-3 py-2 relative group border-l-2 border-[rgba(0,240,255,0.2)] ml-2 mb-2 hover:border-[rgba(0,240,255,0.4)] hover:bg-[rgba(0,240,255,0.02)] transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-[#00f0ff] font-semibold">[{m.username}]</span>
          {m.admin_attr && (
            <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold bg-[rgba(138,43,226,0.15)] border border-[rgba(138,43,226,0.3)] text-[#8a2be2]">
              ADMIN
            </span>
          )}
          <span className="text-[#6b7785] text-xs font-mono">{new Date(m.ts).toLocaleTimeString()}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MessageMenu
            onEdit={() => onEditStart(m.id, m.text)}
            onDelete={() => onDelete(m.id)}
            isOwnMessage={m.email === currentUserEmail}
            isAdmin={isCurrentUserAdmin}
          />
        </div>
      </div>

      {editingMessageId === m.id ? (
        <div className="space-y-2">
          <textarea
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            className="w-full p-3 bg-[rgba(0,0,0,0.7)] border border-[rgba(0,240,255,0.2)] rounded text-[#e6f6ff] text-sm resize-none font-mono focus:border-[rgba(0,240,255,0.5)] focus:outline-none focus:ring-0"
            rows={3}
            placeholder="$ edit message..."
            autoFocus
          />

          {/* Show existing images with remove option */}
          {editingImages.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-[#6b7785] font-mono"># Current images (click × to remove):</div>
              <div className="flex flex-wrap gap-2">
                {editingImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img}
                      alt={`editing-${i}`}
                      className="h-20 w-20 object-cover rounded border border-[rgba(0,240,255,0.2)]"
                    />
                    <button
                      onClick={() => handleImageRemove(i)}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#ff5f56] hover:bg-[#ff3b30] flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => onEditSave(m.id)}
              className="px-3 py-1 bg-[rgba(0,240,255,0.2)] hover:bg-[rgba(0,240,255,0.3)] text-[#00f0ff] border border-[rgba(0,240,255,0.3)] text-xs rounded transition-colors font-mono"
            >
              save
            </button>
            <button
              onClick={onEditCancel}
              className="px-3 py-1 bg-[rgba(255,95,86,0.2)] hover:bg-[rgba(255,95,86,0.3)] text-[#ff5f56] border border-[rgba(255,95,86,0.3)] text-xs rounded transition-colors font-mono"
            >
              cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {m.text && (
            <div className="text-[#e6f6ff] text-sm whitespace-pre-wrap font-mono leading-relaxed">
              <span className="text-[#6b7785] mr-2">$</span>{m.text}
            </div>
          )}
          {imgs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {imgs.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`uploaded-${i}`}
                  className="h-40 w-40 object-cover rounded border border-[rgba(0,240,255,0.2)] cursor-pointer hover:border-[rgba(0,240,255,0.4)] transition-colors"
                  onClick={() => onImageClick(src)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
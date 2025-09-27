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
      className="p-3 relative group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-semibold">{m.username}</span>
          {m.admin_attr && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold"
              style={{
                background: 'rgba(255,0,255,0.12)',
                border: '1px solid rgba(255,0,255,0.35)',
                color: '#ff7bff'
              }}
            >
              ADMIN
            </span>
          )}
          <span className="text-slate-400 text-xs">• {new Date(m.ts).toLocaleString()}</span>
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
            className="w-full p-2 bg-black/60 border border-white/20 rounded text-slate-200 text-sm resize-none"
            rows={3}
            placeholder="Edit your message..."
            autoFocus
          />
          
          {/* Show existing images with remove option */}
          {editingImages.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400">Current images (click × to remove):</div>
              <div className="flex flex-wrap gap-2">
                {editingImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img}
                      alt={`editing-${i}`}
                      className="h-20 w-20 object-cover rounded border border-white/10"
                    />
                    <button
                      onClick={() => handleImageRemove(i)}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
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
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded transition-colors"
            >
              Save
            </button>
            <button
              onClick={onEditCancel}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {m.text && (
            <div className="text-slate-200 text-sm whitespace-pre-wrap">
              {m.text}
            </div>
          )}
          {imgs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {imgs.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`uploaded-${i}`}
                  className="h-40 w-40 object-cover rounded-lg border border-white/10 cursor-pointer"
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
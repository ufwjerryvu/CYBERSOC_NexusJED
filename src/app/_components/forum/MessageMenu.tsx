import { useState, useRef, useEffect } from "react";

interface MessageMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  isOwnMessage: boolean; // Only show menu for user's own messages
  isAdmin?: boolean; // Admins can edit/delete any message
}

export default function MessageMenu({ onEdit, onDelete, isOwnMessage, isAdmin = false }: MessageMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Don't show menu if user can't do anything with this message
  // Show menu if: own message (can edit/delete) OR admin (can delete others' messages)
  if (!isOwnMessage && !isAdmin) {
    return null;
  }

  // Determine what actions are available
  const canEdit = isOwnMessage; // Only own messages can be edited
  const canDelete = isOwnMessage || isAdmin; // Own messages or admin can delete any message

  // Don't show menu if no actions are available
  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
        aria-label="Message options"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-slate-400"
        >
          <circle cx="8" cy="3" r="1.5" fill="currentColor" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="8" cy="13" r="1.5" fill="currentColor" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-8 z-50 bg-slate-800 border border-white/20 rounded-lg shadow-xl py-1 min-w-[120px]"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          {canEdit && (
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-slate-400">
                <path
                  d="M11 2L12 3L4.5 10.5L3 12L4.5 10.5L12 3z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-red-400">
                <path
                  d="M4 5v6h6V5M5 3h4M2 5h10"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
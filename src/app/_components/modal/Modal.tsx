"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
  // When true, allow clicks within the content (e.g., download button). Defaults to false
  allowContentInteraction?: boolean;
};

export default function Modal({ open, onClose, children, ariaLabel, allowContentInteraction = false }: ModalProps) {
  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      aria-label={ariaLabel}
      className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4"
      style={{
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        background: "rgba(0,0,0,0.6)",
        pointerEvents: "auto",
      }}
      // Capture all interactions so nothing behind is clickable
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button is the ONLY interactive control */}
      <button
        type="button"
        aria-label="Close"
        title="Close"
        onClick={onClose}
        className="absolute top-4 right-4 h-10 w-10 rounded-full flex items-center justify-center text-white"
        style={{
          background: "linear-gradient(135deg, #8a2be2, #ff00ff)",
          boxShadow: "0 6px 24px rgba(255,0,255,0.35)",
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      <div
        className="max-w-[90vw] max-h-[85vh]"
        style={{ pointerEvents: allowContentInteraction ? "auto" : "none" }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

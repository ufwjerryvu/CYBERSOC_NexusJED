import Modal from "../modal/Modal";

interface ChatModalsProps {
  previewIndex: number | null;
  imagePreviews: string[];
  modalImage: string | null;
  onClosePreview: () => void;
  onCloseModal: () => void;
}

export default function ChatModals({
  previewIndex,
  imagePreviews,
  modalImage,
  onClosePreview,
  onCloseModal,
}: ChatModalsProps) {
  return (
    <>
      {/* Modal for enlarged preview */}
      <Modal
        open={previewIndex !== null && !!imagePreviews[previewIndex]}
        onClose={onClosePreview}
        ariaLabel="Image preview"
      >
        {previewIndex !== null && imagePreviews[previewIndex] && (
          <img
            src={imagePreviews[previewIndex] as string}
            alt="preview-large"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl border border-white/10"
          />
        )}
      </Modal>

      {/* Modal for clicking chat images */}
      <Modal
        open={!!modalImage}
        onClose={onCloseModal}
        ariaLabel="Image preview"
        allowContentInteraction
      >
        {modalImage && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={modalImage}
              alt="chat-image-large"
              className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl border border-white/10"
            />
            <a
              href={modalImage}
              download
              className="px-4 py-2 rounded-md text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, #8a2be2, #00f0ff)',
                boxShadow: '0 4px 20px rgba(0,240,255,0.25)'
              }}
            >
              Download
            </a>
          </div>
        )}
      </Modal>
    </>
  );
}
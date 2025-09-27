import { useRef, useEffect } from "react";
import Message from "./Message";
import type { Socket } from "socket.io-client";

interface ChatMessage {
  id: string;
  text: string;
  image?: string;
  images?: string[];
  email: string;
  username: string;
  admin_attr: boolean;
  ts: number;
}

interface MessagesListProps {
  messages: ChatMessage[];
  loadingMore: boolean;
  hasMoreMessages: boolean;
  currentUserEmail: string | null;
  isCurrentUserAdmin: boolean;
  editingMessageId: string | null;
  editingText: string;
  editingImages: string[];
  socket: Socket | null;
  shouldAutoScroll: boolean;
  onLoadMore: () => void;
  onEditStart: (messageId: string, currentText: string) => void;
  onEditCancel: () => void;
  onEditSave: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onImageClick: (imageSrc: string) => void;
  onScrollChange: (isAtBottom: boolean, shouldAutoScroll: boolean) => void;
  setEditingText: (text: string) => void;
  setEditingImages: (images: string[]) => void;
}

export default function MessagesList({
  messages,
  loadingMore,
  hasMoreMessages,
  currentUserEmail,
  isCurrentUserAdmin,
  editingMessageId,
  editingText,
  editingImages,
  socket,
  shouldAutoScroll,
  onLoadMore,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDelete,
  onImageClick,
  onScrollChange,
  setEditingText,
  setEditingImages,
}: MessagesListProps) {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Handle scroll detection
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
      const isNearTop = scrollTop <= 50;
      
      onScrollChange(isNearBottom, isNearBottom);
      
      // Load more messages when user scrolls near the top
      if (isNearTop && hasMoreMessages && !loadingMore && messages.length > 0) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [onLoadMore, hasMoreMessages, loadingMore, messages.length, onScrollChange]);

  // Auto-scroll when new messages arrive if user was at bottom
  useEffect(() => {
    if (!shouldAutoScroll) return;
    
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, shouldAutoScroll]);

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 pt-4 nice-scrollbar bg-[#0c0f17]"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(0, 240, 255, 0.3) transparent'
      }}
    >
      {/* Loading more indicator */}
      {loadingMore && (
        <div className="text-center text-[#a0b3c5] py-4 text-sm font-mono">
          <div className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin"></div>
            Loading more messages...
          </div>
        </div>
      )}

      {/* No more messages indicator */}
      {!hasMoreMessages && messages.length > 0 && (
        <div className="text-center text-[#6b7785] py-2 text-xs font-mono">
          --- End of history ---
        </div>
      )}

      {messages.length === 0 && (
        <div className="text-center text-[#a0b3c5] py-8 font-mono">
          <div className="text-[#00f0ff]">$</div>
          <div className="mt-2">No messages yet. Be the first to say hi!</div>
        </div>
      )}

      {messages.map((m, idx) => (
        <Message
          key={`${m.ts}-${m.email}-${idx}`}
          message={m}
          currentUserEmail={currentUserEmail}
          isCurrentUserAdmin={isCurrentUserAdmin}
          editingMessageId={editingMessageId}
          editingText={editingText}
          editingImages={editingImages}
          socket={socket}
          onEditStart={onEditStart}
          onEditCancel={onEditCancel}
          onEditSave={onEditSave}
          onDelete={onDelete}
          onImageClick={onImageClick}
          setEditingText={setEditingText}
          setEditingImages={setEditingImages}
        />
      ))}
    </div>
  );
}
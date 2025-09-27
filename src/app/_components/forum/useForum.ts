import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "~/contexts/AuthContext";

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

export function useForum() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // User state derived from auth context
  const email = user?.email || null;
  const isCurrentUserAdmin = user?.isAdmin || false;
  
  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [oldestTimestamp, setOldestTimestamp] = useState<number | null>(null);
  
  // Compose state
  const [message, setMessage] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  
  // Edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [editingImages, setEditingImages] = useState<string[]>([]);
  
  // Modal state
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  
  // Scroll state
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  // Socket state
  const [sock, setSock] = useState<Socket | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Authentication check - user is handled by AuthContext
  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  // Load initial messages
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingHistory(true);
      try {
        const res = await fetch("/api/messages?limit=20", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setMessages(data.messages || []);
            setHasMoreMessages(data.hasMore || false);
            setOldestTimestamp(data.oldestTimestamp);
          }
        }
      } catch (e) {
        console.error("Failed to load history", e);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || loadingMore || !oldestTimestamp) return;
    
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/messages?limit=20&before=${oldestTimestamp}`, { 
        cache: "no-store" 
      });
      
      if (res.ok) {
        const data = await res.json();
        const newMessages = data.messages || [];
        
        if (newMessages.length > 0) {
          setMessages(prev => [...newMessages, ...prev]);
          setOldestTimestamp(data.oldestTimestamp);
          setHasMoreMessages(data.hasMore || false);
        }
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreMessages, loadingMore, oldestTimestamp]);

  // Get access token from cookies
  const getAccessToken = (): string | null => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'access_token') {
        return value ? decodeURIComponent(value) : null;
      }
    }
    return null;
  };

  // Setup WebSocket connection
  useEffect(() => {
    if (loadingHistory || !user) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      console.log("No access token available for WebSocket connection");
      return;
    }

    const rawEnvUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.WEBSOCKET_URL || "http://localhost:8000";

    const normalizeSocketUrl = (u: string) => {
      try {
        if (u.startsWith("ws://")) return "http://" + u.slice(5);
        if (u.startsWith("wss://")) return "https://" + u.slice(6);
        return u;
      } catch {
        return u;
      }
    };

    const url = normalizeSocketUrl(rawEnvUrl);
    console.log("WebSocket URL:", url);
    console.log("Connecting with JWT token");

    const s = io(url, {
      path: "/message",
      auth: {
        token: accessToken
      }
    });
    setSock(s);

    const onChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onMessageDeleted = (data: { messageId: string }) => {
      setMessages((prev) => prev.filter(m => m.id !== data.messageId));
    };

    const onMessageEdited = (data: { messageId: string; newText: string; images?: string[] }) => {
      setMessages((prev) => prev.map(m => 
        m.id === data.messageId 
          ? { ...m, text: data.newText, images: data.images || [] }
          : m
      ));
    };

    const onImageRemoved = (data: { messageId: string; imageIndex: number }) => {
      setMessages((prev) => prev.map(m => {
        if (m.id === data.messageId) {
          const currentImages = m.images || (m.image ? [m.image] : []);
          const updatedImages = currentImages.filter((_, idx) => idx !== data.imageIndex);
          return { ...m, images: updatedImages };
        }
        return m;
      }));
    };

    s.on("connect", () => {
      console.log("WebSocket connected successfully");
    });

    s.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
    });

    s.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    s.on("chat:error", (error) => {
      console.error("Chat error:", error);
      // If it's an authentication error, try to refresh the user/token
      if (error.message?.includes("Authentication") || error.message?.includes("required")) {
        console.log("Authentication error detected, refreshing user data");
        refreshUser();
      }
    });

    s.on("chat:message", onChatMessage);
    s.on("message:deleted", onMessageDeleted);
    s.on("message:edited", onMessageEdited);
    s.on("message:image-removed", onImageRemoved);

    return () => {
      s.off("connect");
      s.off("disconnect");
      s.off("connect_error");
      s.off("chat:error");
      s.off("chat:message", onChatMessage);
      s.off("message:deleted", onMessageDeleted);
      s.off("message:edited", onMessageEdited);
      s.off("message:image-removed", onImageRemoved);
      s.disconnect();
    };
  }, [loadingHistory, user, refreshUser]);

  // Message handling functions
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !sock) return;

    // Upload images if provided
    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          alert("Image upload failed");
          return;
        }
        const data = await res.json();
        imageUrls.push(data.url as string);
      }
    }

    const text = message.trim();
    if (!text && imageUrls.length === 0) return;
    
    // Force auto-scroll when user sends a message
    setShouldAutoScroll(true);
    setIsAtBottom(true);
    
    sock.emit("chat:message", {
      userId: user?.id,
      email: user?.email,
      username: user?.username,
      text,
      images: imageUrls
    });
    setMessage("");
    setImageFiles([]);
    setImagePreviews([]);
    setPreviewIndex(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setSending(true);
    setTimeout(() => setSending(false), 500);
    
    // Scroll to bottom after a brief delay
    setTimeout(() => setShouldAutoScroll(true), 100);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId) {
      alert("Message ID is missing");
      return;
    }

    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));

        if (sock) {
          sock.emit("message:deleted", { messageId });
        }
      } else {
        console.error("Failed to delete message");
        alert("Failed to delete message. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message. Please try again.");
    }
  };

  const handleEditMessage = (messageId: string, currentText: string) => {
    const message = messages.find(m => m.id === messageId);
    const currentImages = message?.images || (message?.image ? [message.image] : []);
    
    setEditingMessageId(messageId);
    setEditingText(currentText);
    setEditingImages(currentImages);
  };

  const handleSaveEdit = async (messageId: string) => {
    const trimmedText = editingText.trim();
    if (!trimmedText && editingImages.length === 0) {
      alert("Message cannot be empty (must have text or at least one image)");
      return;
    }

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: trimmedText,
          images: editingImages
        }),
      });

      if (response.ok) {
        setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { ...m, text: trimmedText, images: editingImages }
            : m
        ));
        
        if (sock) {
          sock.emit("message:edited", { messageId, newText: trimmedText, images: editingImages });
        }

        setEditingMessageId(null);
        setEditingText("");
        setEditingImages([]);
      } else {
        console.error("Failed to edit message");
        alert("Failed to edit message. Please try again.");
      }
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Failed to edit message. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
    setEditingImages([]);
  };

  const handleImageSelect = (newFiles: File[]) => {
    setImageFiles(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [
      ...prev,
      ...newFiles.map(f => URL.createObjectURL(f)),
    ]);
  };

  const handleImageRemove = (index: number) => {
    setImageFiles(files => files.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current && imagePreviews.length === 1) {
      fileInputRef.current.value = "";
    }
  };

  const handleScrollChange = (isAtBottom: boolean, shouldAutoScroll: boolean) => {
    setIsAtBottom(isAtBottom);
    setShouldAutoScroll(shouldAutoScroll);
  };

  return {
    // State
    email,
    isCurrentUserAdmin,
    messages,
    loadingHistory,
    hasMoreMessages,
    loadingMore,
    message,
    imageFiles,
    imagePreviews,
    sending,
    editingMessageId,
    editingText,
    editingImages,
    previewIndex,
    modalImage,
    shouldAutoScroll,
    sock,
    fileInputRef,

    // Actions
    setMessage,
    setEditingText,
    setEditingImages,
    setPreviewIndex,
    setModalImage,
    loadMoreMessages,
    handleSubmit,
    handleDeleteMessage,
    handleEditMessage,
    handleSaveEdit,
    handleCancelEdit,
    handleImageSelect,
    handleImageRemove,
    handleScrollChange,
  };
}
"use client";

import LoadingScreen from "~/app/_components/loading/LoadingScreen";
import MessagesList from "~/app/_components/forum/MessagesList";
import MessageComposer from "~/app/_components/forum/MessageComposer";
import ChatModals from "~/app/_components/forum/ChatModals";
import { useForum } from "~/app/_components/forum/useForum";
import { useAuth } from "~/contexts/AuthContext";
import Navbar from "../_components/global/Navbar";

export default function ForumPage() {
    const { user, loading } = useAuth();
    const {
        // State
        loadingHistory,
        messages,
        loadingMore,
        hasMoreMessages,
        email,
        isCurrentUserAdmin,
        editingMessageId,
        editingText,
        editingImages,
        message,
        imageFiles,
        imagePreviews,
        sending,
        previewIndex,
        modalImage,
        shouldAutoScroll,
        sock,

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
    } = useForum();

    if (loading || loadingHistory) {
        return <LoadingScreen />;
    }

    if (!user) {
        return <LoadingScreen />;
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-b from-[#090b12] to-[#05060a] text-[#e6f6ff] pt-16">
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,240,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,240,255,0.08)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />
                    <div className="relative max-w-6xl mx-auto p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-5xl font-[900] bg-gradient-to-r from-[#00f0ff] via-[#8a2be2] to-[#ff00ff] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.5)] inline-block">
                                Forum
                            </h1>
                            <div className="text-sm text-[#a0b3c5] mt-2">
                                Welcome, <span className="text-[#00f0ff] font-semibold">{user.username}</span>
                                {user.isAdmin && <span className="text-[#8a2be2] ml-2 font-semibold">(Admin)</span>}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[rgba(0,240,255,0.25)] bg-[#0c0f17] shadow-[inset_0_0_32px_rgba(0,240,255,0.05)]">
                            <div className="flex h-[75vh] flex-col">
                                <div className="flex gap-1.5 p-4 pb-2 border-b border-[rgba(0,240,255,0.15)]">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                    <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                    <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                                    <span className="ml-4 text-sm text-[#a0b3c5] font-mono">~/forum/chat</span>
                                </div>

                                <MessagesList
                                    messages={messages}
                                    loadingMore={loadingMore}
                                    hasMoreMessages={hasMoreMessages}
                                    currentUserEmail={email}
                                    isCurrentUserAdmin={isCurrentUserAdmin}
                                    editingMessageId={editingMessageId}
                                    editingText={editingText}
                                    editingImages={editingImages}
                                    socket={sock}
                                    shouldAutoScroll={shouldAutoScroll}
                                    onLoadMore={loadMoreMessages}
                                    onEditStart={handleEditMessage}
                                    onEditCancel={handleCancelEdit}
                                    onEditSave={handleSaveEdit}
                                    onDelete={handleDeleteMessage}
                                    onImageClick={setModalImage}
                                    onScrollChange={handleScrollChange}
                                    setEditingText={setEditingText}
                                    setEditingImages={setEditingImages}
                                />

                                <MessageComposer
                                    message={message}
                                    imageFiles={imageFiles}
                                    imagePreviews={imagePreviews}
                                    sending={sending}
                                    onMessageChange={setMessage}
                                    onSubmit={handleSubmit}
                                    onImageSelect={handleImageSelect}
                                    onImageRemove={handleImageRemove}
                                    onImagePreview={setPreviewIndex}
                                />
                            </div>
                        </div>

                        <ChatModals
                            modalImage={modalImage}
                            previewIndex={previewIndex}
                            imagePreviews={imagePreviews}
                            onCloseModal={() => setModalImage(null)}
                            onClosePreview={() => setPreviewIndex(null)}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}


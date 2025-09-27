"use client";

import LoadingScreen from "~/app/_components/loading/LoadingScreen";
import MessagesList from "~/app/_components/forum/MessagesList";
import MessageComposer from "~/app/_components/forum/MessageComposer";
import ChatModals from "~/app/_components/forum/ChatModals";
import { useForum } from "~/app/_components/forum/useForum";
import Navbar from "../_components/global/Navbar";

export default function ForumPage() {
    const {
        // State
        checking,
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

    if (checking || loadingHistory) {
        return <LoadingScreen />;
    }

    return (
        <>
            <Navbar />
            <div className="flex h-screen bg-gray-900 text-white">
                <div className="flex-1 flex flex-col">
                    <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
                        <h1 className="text-xl font-bold">Forum Chat</h1>
                        <div className="text-sm text-gray-300">
                            Welcome, <span className="text-blue-400">{email}</span>
                            {isCurrentUserAdmin && <span className="text-red-400 ml-2">(Admin)</span>}
                        </div>
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

                    <ChatModals
                        modalImage={modalImage}
                        previewIndex={previewIndex}
                        imagePreviews={imagePreviews}
                        onCloseModal={() => setModalImage(null)}
                        onClosePreview={() => setPreviewIndex(null)}
                    />
                </div>
            </div>
        </>
    );
}


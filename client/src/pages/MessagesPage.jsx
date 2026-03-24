import React, { useEffect, useMemo, useState } from "react";
import { apiService } from "../services/apiService";

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentProgress, setAttachmentProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedConversationId = selectedConversation?.conversation_id || null;

  const loadConversations = async () => {
    setLoading(true);
    setError("");

    const result = await apiService.getConversations();
    if (!result.success) {
      setError(result.error || "Failed to load conversations");
      setConversations([]);
      setLoading(false);
      return;
    }

    const list = result.data?.conversations || [];
    setConversations(list);

    if (!selectedConversation && list.length > 0) {
      setSelectedConversation(list[0]);
    }

    setLoading(false);
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setMessageLoading(true);
    const result = await apiService.getConversationMessages(conversationId, {
      page: 1,
      limit: 50,
    });

    if (!result.success) {
      setError(result.error || "Failed to load messages");
      setMessages([]);
      setMessageLoading(false);
      return;
    }

    const list = result.data?.messages || [];
    setMessages([...list].reverse());
    setMessageLoading(false);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  const selectedReceiverId = useMemo(
    () => selectedConversation?.other_user_id || null,
    [selectedConversation],
  );

  const handleSend = async (event) => {
    event.preventDefault();

    const trimmedText = text.trim();
    if ((!trimmedText && !attachmentFile) || !selectedReceiverId) {
      return;
    }

    setSending(true);

    let attachmentUrl = null;
    if (attachmentFile) {
      const uploadResult = await apiService.uploadMessageAttachment(
        attachmentFile,
        (percent) => setAttachmentProgress(percent),
      );

      if (!uploadResult.success) {
        setSending(false);
        setError(uploadResult.error || "Failed to upload attachment");
        return;
      }

      attachmentUrl = uploadResult.data?.attachmentUrl || null;
    }

    const result = await apiService.sendMessage({
      receiverId: selectedReceiverId,
      text: trimmedText,
      attachmentUrl,
    });

    if (!result.success) {
      setSending(false);
      setError(result.error || "Failed to send message");
      return;
    }

    setText("");
    setAttachmentFile(null);
    setAttachmentProgress(0);
    setSending(false);
    await Promise.all([
      loadConversations(),
      loadMessages(selectedConversationId),
    ]);
  };

  const isImageAttachment = (url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".gif") ||
      lower.endsWith(".webp")
    );
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Messages
        </h1>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          <aside className="rounded-xl border border-white/15 bg-black/45 p-4">
            <h2 className="text-white font-semibold mb-3">Conversations</h2>
            {loading ? (
              <div className="text-gray-300">Loading...</div>
            ) : (
              <div className="space-y-2">
                {conversations.length === 0 && (
                  <div className="text-gray-300">No conversations yet.</div>
                )}
                {conversations.map((conversation) => (
                  <button
                    key={conversation.conversation_id}
                    type="button"
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                      selectedConversationId === conversation.conversation_id
                        ? "border-purple-400/60 bg-purple-500/15"
                        : "border-white/15 bg-black/30 hover:bg-white/5"
                    }`}
                  >
                    <p className="text-white font-medium">
                      {conversation.other_user_name || "User"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {conversation.last_message_preview || "No messages yet"}
                    </p>
                    {Number(conversation.unread_count || 0) > 0 && (
                      <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-600 text-white">
                        {conversation.unread_count} unread
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="rounded-xl border border-white/15 bg-black/45 p-4 flex flex-col min-h-[520px]">
            {!selectedConversation ? (
              <div className="text-gray-300">
                Select a conversation to start messaging.
              </div>
            ) : (
              <>
                <div className="pb-3 border-b border-white/10">
                  <h3 className="text-white text-lg font-semibold">
                    {selectedConversation.other_user_name}
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-2">
                  {messageLoading && (
                    <div className="text-gray-300">Loading messages...</div>
                  )}
                  {!messageLoading && messages.length === 0 && (
                    <div className="text-gray-300">
                      No messages in this conversation.
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-lg border border-white/15 bg-black/30 p-3"
                    >
                      {message.text && (
                        <p className="text-gray-100 text-sm">{message.text}</p>
                      )}
                      {message.attachment_url && (
                        <div className="mt-2">
                          {isImageAttachment(message.attachment_url) ? (
                            <a
                              href={message.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={message.attachment_url}
                                alt="Attachment"
                                className="max-h-56 rounded-lg border border-white/15"
                              />
                            </a>
                          ) : (
                            <a
                              href={message.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-300 hover:text-blue-200 text-sm underline"
                            >
                              View attachment
                            </a>
                          )}
                        </div>
                      )}
                      <p className="text-[11px] text-gray-500 mt-1">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleSend}
                  className="pt-3 border-t border-white/10 flex gap-2"
                >
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="Type a message"
                      className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) {
                            setError("Attachment must be 10MB or smaller");
                            return;
                          }
                          setAttachmentFile(file);
                          setError("");
                        }}
                        className="text-xs text-gray-300 file:mr-2 file:rounded-md file:border-0 file:bg-purple-600/70 file:px-2 file:py-1 file:text-white"
                      />
                      {attachmentFile && (
                        <span className="text-xs text-gray-300 truncate max-w-[220px]">
                          {attachmentFile.name}
                        </span>
                      )}
                    </div>
                    {sending &&
                      attachmentProgress > 0 &&
                      attachmentProgress < 100 && (
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${attachmentProgress}%` }}
                          />
                        </div>
                      )}
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;

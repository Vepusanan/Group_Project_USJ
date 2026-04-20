import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const MAX_CHARS = 5000;
const POLL_INTERVAL_MS = 5000;

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const isImageAttachment = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase().split("?")[0];
  return [".jpg", ".jpeg", ".png", ".gif", ".webp"].some((ext) => lower.endsWith(ext));
};

const MessagesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [composeTarget, setComposeTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentProgress, setAttachmentProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState("");

  const shouldScrollToBottomRef = useRef(false);
  const messagesEndRef = useRef(null);
  const pollTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const selectedConversationId = selectedConversation?.conversation_id || null;

  const queryTarget = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get("userId");
    const name = params.get("name") || "User";
    if (!userId) return null;
    return { userId, name };
  }, [location.search]);

  const loadConversations = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError("");

    const result = await apiService.getConversations();
    if (!result.success) {
      if (!isBackground) {
        setError(result.error || "Failed to load conversations");
        setConversations([]);
        setLoading(false);
      }
      return;
    }

    const list = result.data?.conversations || [];
    setConversations(list);

    if (!isBackground) {
      if (queryTarget?.userId) {
        const matched = list.find(
          (c) => String(c.other_user_id) === String(queryTarget.userId),
        );
        if (matched) {
          setSelectedConversation(matched);
          setComposeTarget(null);
        } else {
          setSelectedConversation(null);
          setComposeTarget({
            other_user_id: queryTarget.userId,
            other_user_name: queryTarget.name,
          });
        }
      } else if (!selectedConversation && list.length > 0) {
        setSelectedConversation(list[0]);
        setComposeTarget(null);
      } else if (selectedConversation) {
        const stillExists = list.find(
          (c) => c.conversation_id === selectedConversation.conversation_id,
        );
        if (!stillExists) setSelectedConversation(list[0] || null);
      }
      setLoading(false);
    }
  }, [queryTarget, selectedConversation]);

  const loadMessages = useCallback(async (conversationId, isBackground = false) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    if (!isBackground) setMessageLoading(true);

    const result = await apiService.getConversationMessages(conversationId, {
      page: 1,
      limit: 50,
    });

    if (!result.success) {
      if (!isBackground) {
        setError(result.error || "Failed to load messages");
        setMessages([]);
        setMessageLoading(false);
      }
      return;
    }

    const list = [...(result.data?.messages || [])].reverse();

    if (isBackground) {
      setMessages((prev) => {
        if (list.length > prev.length) {
          shouldScrollToBottomRef.current = true;
          return list;
        }
        return prev;
      });
    } else {
      setMessages(list);
      setMessageLoading(false);
    }
  }, []);

  const scrollToBottom = (behavior = "smooth") => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
    });
  };

  // Initial load
  useEffect(() => {
    loadConversations(false);
  }, [queryTarget?.userId]);

  // Load messages when conversation changes
  useEffect(() => {
    loadMessages(selectedConversationId, false);
  }, [selectedConversationId]);

  // Background poll — refresh conversations + active message thread
  useEffect(() => {
    const poll = async () => {
      await loadConversations(true);
      if (selectedConversationId) {
        await loadMessages(selectedConversationId, true);
      }
    };

    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(pollTimerRef.current);
  }, [selectedConversationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (!shouldScrollToBottomRef.current) return;
    scrollToBottom("smooth");
    shouldScrollToBottomRef.current = false;
  }, [messages.length]);

  const selectedReceiverId = useMemo(() => {
    if (selectedConversation?.other_user_id) return selectedConversation.other_user_id;
    if (composeTarget?.other_user_id) return composeTarget.other_user_id;
    return null;
  }, [selectedConversation, composeTarget]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setComposeTarget(null);
    shouldScrollToBottomRef.current = true;
  };

  const handleSend = async (event) => {
    event.preventDefault();

    const trimmedText = text.trim();
    if ((!trimmedText && !attachmentFile) || !selectedReceiverId) return;

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
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSending(false);

    const createdMessage = result.data?.data;
    if (createdMessage) {
      shouldScrollToBottomRef.current = true;
      setMessages((prev) => [...prev, createdMessage]);
    }

    await loadConversations(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const charsLeft = MAX_CHARS - text.length;

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">Messages</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-100 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} className="text-rose-300 hover:text-rose-100 ml-4">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
          {/* ── SIDEBAR ── */}
          <aside className="rounded-xl border border-white/15 bg-black/45 overflow-hidden flex flex-col lg:max-h-[calc(100vh-180px)]">
            <div className="p-3 border-b border-white/10">
              <h2 className="text-white font-semibold text-sm">Conversations</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 && !composeTarget ? (
              <div className="p-6 text-center">
                <p className="text-gray-400 text-sm mb-3">No conversations yet.</p>
                <p className="text-gray-500 text-xs">
                  Connect with{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/startups")}
                    className="text-blue-300 hover:text-blue-200 underline"
                  >
                    startups
                  </button>
                  {" "}or{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/investors")}
                    className="text-blue-300 hover:text-blue-200 underline"
                  >
                    investors
                  </button>
                  {" "}to start messaging.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {composeTarget && !conversations.find(
                  (c) => String(c.other_user_id) === String(composeTarget.other_user_id)
                ) && (
                  <button
                    type="button"
                    onClick={() => { setSelectedConversation(null); }}
                    className="w-full text-left px-3 py-3 border-b border-white/10 bg-purple-500/15 border-l-2 border-l-purple-400"
                  >
                    <p className="text-white text-sm font-medium">{composeTarget.other_user_name}</p>
                    <p className="text-xs text-gray-400 truncate">New conversation</p>
                  </button>
                )}

                {conversations.map((conversation) => {
                  const isSelected = selectedConversationId === conversation.conversation_id;
                  const unread = Number(conversation.unread_count || 0);
                  return (
                    <button
                      key={conversation.conversation_id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full text-left px-3 py-3 border-b border-white/5 transition-colors ${
                        isSelected
                          ? "bg-purple-500/15 border-l-2 border-l-purple-400"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-white/50">
                              {(conversation.other_user_name || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {conversation.other_user_name || "User"}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {conversation.last_message_preview || "No messages yet"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {conversation.last_message_at && (
                            <span className="text-[10px] text-gray-500">
                              {formatTime(conversation.last_message_at)}
                            </span>
                          )}
                          {unread > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white font-medium min-w-[18px] text-center">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* ── CHAT PANEL ── */}
          <section className="rounded-xl border border-white/15 bg-black/45 flex flex-col h-[70vh] max-h-[760px] min-h-[520px]">
            {!selectedConversation && !composeTarget ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Select a conversation to start messaging.
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white/50">
                        {(selectedConversation?.other_user_name || composeTarget?.other_user_name || "U")
                          .charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold">
                      {selectedConversation?.other_user_name || composeTarget?.other_user_name || "User"}
                    </h3>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2">
                  {messageLoading && (
                    <div className="flex justify-center">
                      <div className="w-5 h-5 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
                    </div>
                  )}
                  {!messageLoading && messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      {selectedConversation
                        ? "No messages yet. Send the first one!"
                        : "Send a message to start this conversation."}
                    </div>
                  )}

                  {messages.map((message) => {
                    const isMine = String(message.sender_id) === String(user?.id);
                    return (
                      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 border ${
                            isMine
                              ? "bg-gradient-to-r from-purple-700/90 to-indigo-700/90 border-purple-400/40 text-white"
                              : "bg-black/35 border-white/15 text-gray-100"
                          }`}
                        >
                          <p className={`text-[11px] mb-1 font-medium ${isMine ? "text-purple-100" : "text-gray-400"}`}>
                            {isMine
                              ? "You"
                              : selectedConversation?.other_user_name || composeTarget?.other_user_name || "User"}
                          </p>

                          {message.text && (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                          )}

                          {message.attachment_url && (
                            <div className="mt-2">
                              {isImageAttachment(message.attachment_url) ? (
                                <a href={message.attachment_url} target="_blank" rel="noreferrer">
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
                                  className="text-blue-200 hover:text-blue-100 text-sm underline"
                                >
                                  View attachment
                                </a>
                              )}
                            </div>
                          )}

                          <p className={`text-[10px] mt-2 ${isMine ? "text-purple-100/70" : "text-gray-500"}`}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Compose area */}
                <form onSubmit={handleSend} className="px-4 pt-3 pb-4 border-t border-white/10 space-y-2">
                  <div className="flex gap-2">
                    <textarea
                      value={text}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_CHARS) setText(e.target.value);
                      }}
                      onKeyDown={handleKeyDown}
                      rows={2}
                      placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                      className="flex-1 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500 text-sm resize-none"
                    />
                    <button
                      type="submit"
                      disabled={sending || (!text.trim() && !attachmentFile)}
                      className="px-4 py-2 self-end rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                      {sending ? "…" : "Send"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <label className="cursor-pointer">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (!file) return;
                            if (file.size > 10 * 1024 * 1024) {
                              setError("Attachment must be 10 MB or smaller");
                              return;
                            }
                            setAttachmentFile(file);
                            setError("");
                          }}
                        />
                        <span className="text-xs text-gray-400 hover:text-gray-200 border border-white/15 rounded-md px-2 py-1 transition-colors">
                          Attach file
                        </span>
                      </label>
                      {attachmentFile && (
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-xs text-gray-300 truncate max-w-[180px]">
                            {attachmentFile.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAttachmentFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="text-gray-500 hover:text-gray-300 text-xs flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    <span className={`text-[11px] flex-shrink-0 ${charsLeft < 200 ? "text-amber-400" : "text-gray-600"}`}>
                      {charsLeft.toLocaleString()} left
                    </span>
                  </div>

                  {sending && attachmentProgress > 0 && attachmentProgress < 100 && (
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all"
                        style={{ width: `${attachmentProgress}%` }}
                      />
                    </div>
                  )}
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

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import { connectSocket, disconnectSocket } from "../services/socketService";
import { useAuth } from "../hooks/useAuth";
import {
  cardIdentityClass,
  cardIdentitySubtitleMutedClass,
  cardIdentityTitleClass,
} from "../styles/theme";

const MAX_CHARS = 5000;
const POLL_INTERVAL_MS = 30000;
const POLL_INTERVAL_SOCKET_MS = 120000;

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
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationSort, setConversationSort] = useState("recent");
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
  const [socketConnected, setSocketConnected] = useState(false);
  const fileInputRef = useRef(null);

  const selectedConversationId = selectedConversation?.conversation_id || null;
  const hasActiveChat = !!(selectedConversation || composeTarget);

  const handleBackToList = () => {
    setSelectedConversation(null);
    setComposeTarget(null);
    setMessages([]);
    navigate("/messages", { replace: true });
  };

  const queryTarget = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get("userId");
    const name = params.get("name") || "User";
    const photo = params.get("photo") || null;
    if (!userId) return null;
    return { userId, name, photo };
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
            other_user_photo_url: queryTarget.photo || null,
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

  // Real-time delivery via WebSocket (falls back to slower poll if disconnected)
  useEffect(() => {
    if (!user?.id) return undefined;

    const socket = connectSocket();

    const onConnect = () => {
      setSocketConnected(true);
    };
    const onDisconnect = () => {
      setSocketConnected(false);
    };
    const onNewMessage = (messageData) => {
      if (
        selectedConversationId &&
        String(messageData.conversation_id || messageData.conversationId) ===
          String(selectedConversationId)
      ) {
        shouldScrollToBottomRef.current = true;
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(messageData.id))) {
            return prev;
          }
          return [...prev, messageData];
        });
      }
      loadConversations(true);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message:new", onNewMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message:new", onNewMessage);
      disconnectSocket();
    };
  }, [user?.id, selectedConversationId, loadConversations]);

  useEffect(() => {
    const poll = async () => {
      await loadConversations(true);
      if (selectedConversationId) {
        await loadMessages(selectedConversationId, true);
      }
    };

    const interval = socketConnected
      ? POLL_INTERVAL_SOCKET_MS
      : POLL_INTERVAL_MS;

    pollTimerRef.current = setInterval(poll, interval);
    return () => clearInterval(pollTimerRef.current);
  }, [selectedConversationId, loadConversations, loadMessages, socketConnected]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (!shouldScrollToBottomRef.current) return;
    scrollToBottom("smooth");
    shouldScrollToBottomRef.current = false;
  }, [messages.length]);

  const filteredConversations = useMemo(() => {
    let list = [...conversations];

    if (conversationSearch.trim()) {
      const q = conversationSearch.toLowerCase();
      list = list.filter((c) => (c.other_user_name || "").toLowerCase().includes(q));
    }

    if (conversationSort === "unread") {
      list = list.filter((c) => Number(c.unread_count || 0) > 0);
    } else if (conversationSort === "recent") {
      list.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
    }

    return list;
  }, [conversations, conversationSearch, conversationSort]);

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
        <h1 className="text-3xl md:text-4xl font-bold text-content mb-6">Messages</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-error text-sm flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} className="text-error hover:text-error-dark ml-4">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
          {/* ── SIDEBAR ── */}
          <aside
            className={`rounded-xl border border-line bg-surface shadow-sm overflow-hidden flex-col lg:max-h-[calc(100vh-180px)] ${
              hasActiveChat ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="p-3 border-b border-line space-y-2">
              <h2 className="text-content font-semibold text-sm">Conversations</h2>
              <input
                type="text"
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
                placeholder="Search by name…"
                className="w-full rounded-md bg-surface-alt border border-line px-2 py-1.5 text-sm text-content placeholder:text-content-muted"
              />
              <select
                value={conversationSort}
                onChange={(e) => setConversationSort(e.target.value)}
                className="w-full rounded-md bg-surface-alt border border-line px-2 py-1.5 text-sm text-content"
              >
                <option value="recent">Recent</option>
                <option value="unread">Unread only</option>
                <option value="all">All</option>
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-4 border-primary-light/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 && !composeTarget ? (
              <div className="p-6 text-center">
                <p className="text-content-muted text-sm mb-3">No conversations yet.</p>
                <p className="text-content-muted text-xs">
                  Connect with{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/startups")}
                    className="text-primary hover:text-primary-dark underline"
                  >
                    startups
                  </button>
                  {" "}or{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/investors")}
                    className="text-primary hover:text-primary-dark underline"
                  >
                    investors
                  </button>
                  {" "}to start messaging.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {filteredConversations.length === 0 && conversations.length > 0 && (
                  <p className="text-center text-content-muted text-xs p-4">No conversations match your search.</p>
                )}
                {composeTarget && !conversations.find(
                  (c) => String(c.other_user_id) === String(composeTarget.other_user_id)
                ) && (
                  <button
                    type="button"
                    onClick={() => { setSelectedConversation(null); }}
                    className="w-full text-left px-3 py-3 border-b border-line bg-primary-light/15 border-l-2 border-l-primary"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-alt border border-line flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {composeTarget.other_user_photo_url
                          ? <img src={composeTarget.other_user_photo_url} alt={composeTarget.other_user_name} className="w-full h-full object-cover" />
                          : <span className="text-xs font-semibold text-content/50">{(composeTarget.other_user_name || "U").charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div className={cardIdentityClass}>
                        <p className={cardIdentityTitleClass}>{composeTarget.other_user_name}</p>
                        <p className={cardIdentitySubtitleMutedClass}>New conversation</p>
                      </div>
                    </div>
                  </button>
                )}

                {filteredConversations.map((conversation) => {
                  const isSelected = selectedConversationId === conversation.conversation_id;
                  const unread = Number(conversation.unread_count || 0);
                  return (
                    <button
                      key={conversation.conversation_id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full text-left px-3 py-3 border-b border-line transition-colors ${
                        isSelected
                          ? "bg-primary-light/15 border-l-2 border-l-primary"
                          : "hover:bg-surface-alt"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-surface-alt border border-line flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {conversation.other_user_photo_url
                              ? <img src={conversation.other_user_photo_url} alt={conversation.other_user_name} className="w-full h-full object-cover" />
                              : <span className="text-xs font-semibold text-content/50">{(conversation.other_user_name || "U").charAt(0).toUpperCase()}</span>
                            }
                          </div>
                          <div className={`min-w-0 ${cardIdentityClass}`}>
                            <p className={`${cardIdentityTitleClass} truncate`}>
                              {conversation.other_user_name || "User"}
                            </p>
                            <p className={`${cardIdentitySubtitleMutedClass} truncate`}>
                              {conversation.last_message_preview || "No messages yet"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {conversation.last_message_at && (
                            <span className="text-[10px] text-content-muted">
                              {formatTime(conversation.last_message_at)}
                            </span>
                          )}
                          {unread > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-content-inverse font-medium min-w-[18px] text-center">
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
          <section
            className={`rounded-xl border border-line bg-surface shadow-sm flex-col h-[calc(100dvh-12rem)] min-h-[320px] max-h-[760px] lg:h-[70vh] lg:min-h-[520px] ${
              hasActiveChat ? "flex" : "hidden lg:flex"
            }`}
          >
            {!selectedConversation && !composeTarget ? (
              <div className="flex-1 flex items-center justify-center text-content-muted text-sm">
                Select a conversation to start messaging.
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-4 sm:px-5 py-3 border-b border-line flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    aria-label="Back to conversations"
                    className="lg:hidden p-2 -ml-1 rounded-lg text-content-muted hover:text-content hover:bg-surface-alt transition-colors shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-surface-alt border border-line flex items-center justify-center overflow-hidden flex-shrink-0">
                    {(selectedConversation?.other_user_photo_url || composeTarget?.other_user_photo_url)
                      ? <img src={selectedConversation?.other_user_photo_url || composeTarget?.other_user_photo_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sm font-bold text-content/60">{(selectedConversation?.other_user_name || composeTarget?.other_user_name || "U").charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <h3 className="text-content font-semibold leading-tight">
                      {selectedConversation?.other_user_name || composeTarget?.other_user_name || "User"}
                    </h3>
                  </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1">
                  {messageLoading && (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-4 border-primary-light/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}
                  {!messageLoading && messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-content-muted text-sm">
                      {selectedConversation
                        ? "No messages yet. Send the first one!"
                        : "Send a message to start this conversation."}
                    </div>
                  )}

                  {messages.map((message, idx) => {
                    const isMine = String(message.sender_id) === String(user?.id);
                    const prevMsg = messages[idx - 1];
                    const nextMsg = messages[idx + 1];
                    const isFirstInGroup = !prevMsg || String(prevMsg.sender_id) !== String(message.sender_id);
                    const isLastInGroup = !nextMsg || String(nextMsg.sender_id) !== String(message.sender_id);
                    const otherPhoto = selectedConversation?.other_user_photo_url || composeTarget?.other_user_photo_url;
                    const otherName = selectedConversation?.other_user_name || composeTarget?.other_user_name || "User";

                    return (
                      <div key={message.id} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}>
                        {/* Avatar for received messages */}
                        {!isMine && (
                          <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-surface-alt border border-line flex items-center justify-center mb-0.5">
                            {isLastInGroup ? (
                              otherPhoto
                                ? <img src={otherPhoto} alt={otherName} className="w-full h-full object-cover" />
                                : <span className="text-[10px] font-bold text-content/50">{otherName.charAt(0).toUpperCase()}</span>
                            ) : null}
                          </div>
                        )}

                        <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          {isFirstInGroup && !isMine && (
                            <span className="text-[11px] text-content-muted mb-1 ml-1">{otherName}</span>
                          )}
                          <div className={`px-4 py-2.5 text-sm break-words ${
                            isMine
                              ? `bg-gradient-to-br from-primary to-primary-dark text-content ${isFirstInGroup ? "rounded-t-2xl" : "rounded-t-lg"} rounded-bl-2xl ${isLastInGroup ? "rounded-br-sm" : "rounded-br-lg"}`
                              : `bg-surface-alt border border-line text-content-secondary ${isFirstInGroup ? "rounded-t-2xl" : "rounded-t-lg"} rounded-br-2xl ${isLastInGroup ? "rounded-bl-sm" : "rounded-bl-lg"}`
                          }`}>
                            {message.text && (
                              <p className="whitespace-pre-wrap">{message.text}</p>
                            )}
                            {message.attachment_url && (
                              <div className={message.text ? "mt-2" : ""}>
                                {isImageAttachment(message.attachment_url) ? (
                                  <a href={message.attachment_url} target="_blank" rel="noreferrer">
                                    <img src={message.attachment_url} alt="Attachment" className="max-h-56 rounded-lg border border-line" />
                                  </a>
                                ) : (
                                  <a href={message.attachment_url} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-dark underline">
                                    View attachment
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          {isLastInGroup && (
                            <span className={`text-[10px] mt-1 ${isMine ? "text-content-muted mr-1" : "text-content-secondary ml-1"}`}>
                              {formatTime(message.created_at)}
                            </span>
                          )}
                        </div>

                        {/* Spacer for sent messages to keep avatar column width consistent */}
                        {isMine && <div className="w-7 flex-shrink-0" />}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Compose area */}
                <form onSubmit={handleSend} className="px-4 py-3 border-t border-line">
                  {/* Upload progress */}
                  {sending && attachmentProgress > 0 && attachmentProgress < 100 && (
                    <div className="h-1 bg-surface-alt rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-primary-light transition-all" style={{ width: `${attachmentProgress}%` }} />
                    </div>
                  )}

                  {/* Attachment preview */}
                  {attachmentFile && (
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-xs text-content-secondary truncate max-w-[260px]">{attachmentFile.name}</span>
                      <button
                        type="button"
                        onClick={() => { setAttachmentFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="text-content-muted hover:text-content-secondary text-xs flex-shrink-0"
                      >✕</button>
                    </div>
                  )}

                  {/* Input row */}
                  <div className="flex items-center gap-2">
                    {/* Attach button */}
                    <label className="cursor-pointer flex-shrink-0">
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
                      <span className="flex items-center justify-center w-10 h-10 rounded-xl border border-line text-content-muted hover:text-content hover:border-line-strong transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </label>

                    {/* Textarea */}
                    <textarea
                      value={text}
                      onChange={(e) => { if (e.target.value.length <= MAX_CHARS) setText(e.target.value); }}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      placeholder="Type a message…"
                      className="flex-1 rounded-xl bg-surface-alt border border-line px-4 py-2.5 text-content placeholder:text-content-muted text-sm resize-none focus:outline-none focus:border-primary-light/50 transition-colors leading-5"
                      style={{ height: "42px", maxHeight: "120px", overflowY: "auto" }}
                    />

                    {/* Send button */}
                    <button
                      type="submit"
                      disabled={sending || (!text.trim() && !attachmentFile)}
                      className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-content disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                      {sending ? (
                        <div className="w-4 h-4 border-2 border-line-strong border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                      )}
                    </button>
                  </div>

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

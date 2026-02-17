import { useState, useEffect, useRef, useCallback } from 'react';
import { discussionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiSend, FiTrash2, FiMessageSquare, FiX, FiBell, FiChevronDown,
  FiChevronUp, FiSpeaker, FiMapPin,
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const EMOJIS = ['👍', '❤️', '😂', '😮', '👏'];

// ── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

const summarizeReactions = (reactions = []) => {
  const map = {};
  reactions.forEach(r => { map[r.emoji] = (map[r.emoji] || 0) + 1; });
  return map;
};

// ── Sub-components ────────────────────────────────────────────────────────────

const ReactionBar = ({ reactions, userReaction, onReact, compact }) => {
  const [open, setOpen] = useState(false);
  const summary = typeof reactions === 'object' && !Array.isArray(reactions)
    ? reactions
    : summarizeReactions(reactions);

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing reaction counts */}
      {Object.entries(summary).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors
            ${userReaction === emoji
              ? 'bg-blue-100 border-blue-400 text-blue-700'
              : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}
        >
          {emoji} <span>{count}</span>
        </button>
      ))}

      {/* Add reaction picker */}
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="px-2 py-0.5 rounded-full text-xs border border-gray-200 hover:bg-gray-100 text-gray-500"
          title="React"
        >
          {open ? '✕' : '😊'}
        </button>
        {open && (
          <div className="absolute bottom-full left-0 mb-1 flex gap-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1 z-20">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => { onReact(e); setOpen(false); }}
                className="hover:scale-125 transition-transform text-base"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MessageBubble = ({
  message, currentUserId, isOrganizer, onDelete, onPin, onReact, onReply,
  depth = 0,
}) => {
  const [showReplies, setShowReplies] = useState(true);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const isOwn = message.author?._id === currentUserId || message.author === currentUserId;
  const canDelete = isOwn || isOrganizer;
  const canPin = isOrganizer && depth === 0;

  const userReaction = (() => {
    if (!Array.isArray(message.reactions)) return null;
    const mine = message.reactions.find(r =>
      r.user === currentUserId || r.user?._id === currentUserId
    );
    return mine?.emoji || null;
  })();

  const reactionSummary = (() => {
    if (typeof message.reactions === 'object' && !Array.isArray(message.reactions)) {
      return message.reactions; // already summarized from socket event
    }
    return summarizeReactions(message.reactions || []);
  })();

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await onReply(message._id, replyText.trim());
      setReplyText('');
      setReplying(false);
    } finally {
      setSubmittingReply(false);
    }
  };

  const bgColor = message.isAnnouncement
    ? 'bg-amber-50 border-l-4 border-amber-400'
    : message.isPinned
    ? 'bg-blue-50 border-l-4 border-blue-400'
    : depth > 0
    ? 'bg-gray-50'
    : 'bg-white';

  return (
    <div className={`${depth > 0 ? 'ml-6 mt-2' : 'mb-3'}`}>
      <div className={`rounded-lg p-3 border border-gray-100 ${bgColor}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0
              ${message.authorModel === 'Organizer' ? 'bg-purple-500' : 'bg-blue-500'}`}>
              {(message.authorName || '?')[0].toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-gray-800">{message.authorName}</span>
            {message.authorModel === 'Organizer' && (
              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">Organizer</span>
            )}
            {message.isAnnouncement && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <FiSpeaker size={10} /> Announcement
              </span>
            )}
            {message.isPinned && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <FiMapPin size={10} /> Pinned
              </span>
            )}
            <span className="text-xs text-gray-400">{timeAgo(message.createdAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {canPin && (
              <button
                onClick={() => onPin(message._id)}
                className={`p-1 rounded hover:bg-gray-100 ${message.isPinned ? 'text-blue-500' : 'text-gray-400'}`}
                title={message.isPinned ? 'Unpin' : 'Pin'}
              >
                <FiMapPin size={13} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(message._id)}
                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <FiTrash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Footer: reactions + reply */}
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          <ReactionBar
            reactions={reactionSummary}
            userReaction={userReaction}
            onReact={(emoji) => onReact(message._id, emoji)}
          />
          {depth === 0 && (
            <button
              onClick={() => setReplying(r => !r)}
              className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
            >
              <FiMessageSquare size={12} />
              {message.replyCount > 0 ? `${message.replyCount} ${message.replyCount === 1 ? 'reply' : 'replies'}` : 'Reply'}
            </button>
          )}
        </div>

        {/* Reply input */}
        {replying && (
          <div className="mt-3 flex gap-2">
            <input
              autoFocus
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitReply(); } }}
              placeholder="Write a reply…"
              maxLength={2000}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              onClick={handleSubmitReply}
              disabled={submittingReply || !replyText.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 hover:bg-blue-700"
            >
              {submittingReply ? '…' : <FiSend size={14} />}
            </button>
            <button onClick={() => setReplying(false)} className="px-2 py-1.5 text-gray-400 hover:text-gray-600">
              <FiX size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Replies */}
      {message.replies?.length > 0 && (
        <div>
          <button
            onClick={() => setShowReplies(v => !v)}
            className="ml-6 mt-1 text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            {showReplies ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
            {showReplies ? 'Hide' : 'Show'} {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
          </button>
          {showReplies && message.replies.map(reply => (
            <MessageBubble
              key={reply._id}
              message={reply}
              currentUserId={currentUserId}
              isOrganizer={isOrganizer}
              onDelete={onDelete}
              onPin={onPin}
              onReact={onReact}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const DiscussionForum = ({ eventId }) => {
  const { user, role } = useAuth();
  const currentUserId = user?._id;
  const isOrganizer = role === 'organizer';

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [posting, setPosting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]); // notification toasts

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((text, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  // ── Load initial messages ──────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      const res = await discussionAPI.getMessages(eventId);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load discussion:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // ── Socket.io ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMessages();

    let socket = null;

    // Wrap in try/catch — if socket.io-client is not installed the forum still works
    try {
      const { io } = require('socket.io-client');
      socket = io(API_URL, { transports: ['websocket', 'polling'] });
      socketRef.current = socket;
      socket.emit('join-event', eventId);

      socket.on('new-message', (msg) => {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, { ...msg, replies: msg.replies || [], replyCount: 0 }];
        });
        setUnreadCount(c => c + 1);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      socket.on('new-reply', ({ parentId, reply }) => {
        setMessages(prev => prev.map(m => {
          if (m._id !== parentId) return m;
          const exists = (m.replies || []).find(r => r._id === reply._id);
          if (exists) return m;
          return { ...m, replies: [...(m.replies || []), reply], replyCount: (m.replyCount || 0) + 1 };
        }));
      });

      socket.on('message-deleted', ({ messageId }) => {
        setMessages(prev => {
          const filtered = prev.filter(m => m._id !== messageId);
          return filtered.map(m => ({
            ...m,
            replies: (m.replies || []).filter(r => r._id !== messageId),
            replyCount: Math.max(0, (m.replyCount || 0) - ((m.replies || []).some(r => r._id === messageId) ? 1 : 0)),
          }));
        });
      });

      socket.on('message-pinned', ({ messageId, isPinned }) => {
        setMessages(prev => {
          const updated = prev.map(m => m._id === messageId ? { ...m, isPinned } : m);
          return [...updated].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            if (a.isAnnouncement && !b.isAnnouncement) return -1;
            if (!a.isAnnouncement && b.isAnnouncement) return 1;
            return new Date(a.createdAt) - new Date(b.createdAt);
          });
        });
      });

      socket.on('reaction-updated', ({ messageId, reactions }) => {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
      });

      socket.on('announcement', ({ content, authorName }) => {
        addToast(`📢 ${authorName}: ${content.slice(0, 80)}${content.length > 80 ? '…' : ''}`, 'announcement');
      });

    } catch (e) {
      console.warn('Real-time disabled (socket.io-client unavailable):', e.message);
    }

    return () => {
      if (socket) {
        socket.emit('leave-event', eventId);
        socket.disconnect();
      }
    };
  }, [eventId, fetchMessages, addToast]);

  // ── Mark read when tab is focused ─────────────────────────────────────────
  useEffect(() => {
    if (unreadCount > 0) {
      discussionAPI.markRead(eventId).catch(() => {});
      setUnreadCount(0);
    }
  }, [unreadCount, eventId]);

  // ── Post message ───────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!newMessage.trim() || posting) return;
    setPosting(true);
    try {
      await discussionAPI.postMessage(eventId, {
        content: newMessage.trim(),
        isAnnouncement,
      });
      setNewMessage('');
      setIsAnnouncement(false);
      // Socket will deliver it back via 'new-message'
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to post message', 'error');
    } finally {
      setPosting(false);
    }
  };

  // ── Reply ──────────────────────────────────────────────────────────────────
  const handleReply = async (parentId, content) => {
    await discussionAPI.postReply(parentId, { content });
    // Socket delivers via 'new-reply'
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    try {
      await discussionAPI.deleteMessage(messageId);
    } catch (err) {
      addToast('Failed to delete message', 'error');
    }
  };

  // ── Pin ───────────────────────────────────────────────────────────────────
  const handlePin = async (messageId) => {
    try {
      await discussionAPI.pinMessage(messageId);
    } catch (err) {
      addToast('Failed to pin message', 'error');
    }
  };

  // ── React ─────────────────────────────────────────────────────────────────
  const handleReact = async (messageId, emoji) => {
    try {
      await discussionAPI.reactToMessage(messageId, { emoji });
    } catch (err) {
      addToast('Failed to react', 'error');
    }
  };

  if (!currentUserId) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please log in to participate in the discussion.
      </div>
    );
  }

  return (
    <div className="relative flex flex-col" style={{ minHeight: '400px' }}>

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-xs animate-fade-in pointer-events-auto
              ${t.type === 'announcement' ? 'bg-amber-50 border border-amber-300 text-amber-800'
                : t.type === 'error' ? 'bg-red-50 border border-red-300 text-red-800'
                : 'bg-blue-50 border border-blue-300 text-blue-800'}`}
          >
            <div className="flex items-start gap-2">
              <FiBell size={14} className="mt-0.5 flex-shrink-0" />
              <span>{t.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <FiBell size={14} />
          {unreadCount} new {unreadCount === 1 ? 'message' : 'messages'}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-1"
        style={{ maxHeight: '500px', minHeight: '300px' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">Loading discussion…</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FiMessageSquare size={36} className="mb-2 opacity-40" />
            <p>No messages yet. Be the first to post!</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg._id}
              message={msg}
              currentUserId={currentUserId}
              isOrganizer={isOrganizer}
              onDelete={handleDelete}
              onPin={handlePin}
              onReact={handleReact}
              onReply={handleReply}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        {isOrganizer && (
          <label className="flex items-center gap-2 mb-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={isAnnouncement}
              onChange={e => setIsAnnouncement(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-amber-700 font-medium flex items-center gap-1">
              <FiSpeaker size={13} /> Post as Announcement
            </span>
          </label>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePost();
              }
            }}
            placeholder={
              isOrganizer
                ? 'Write a message or announcement… (Enter to send, Shift+Enter for newline)'
                : 'Ask a question or join the discussion… (Enter to send)'
            }
            maxLength={2000}
            rows={2}
            className={`flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 resize-none
              ${isAnnouncement
                ? 'border-amber-300 focus:ring-amber-300 bg-amber-50'
                : 'border-gray-200 focus:ring-blue-300'}`}
          />
          <button
            onClick={handlePost}
            disabled={posting || !newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
          >
            {posting ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <FiSend size={16} />
            )}
            {posting ? 'Posting…' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {newMessage.length}/2000 · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default DiscussionForum;
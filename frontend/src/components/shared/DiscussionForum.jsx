import { useState, useEffect, useRef, useCallback } from 'react';
import { discussionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import {
  FiSend, FiTrash2, FiMessageSquare, FiX, FiBell, FiChevronDown,
  FiChevronUp, FiSpeaker, FiMapPin,
} from 'react-icons/fi';

const EMOJIS = ['👍', '❤️', '😂', '😮', '👏'];


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


const ReactionBar = ({ reactions, userReaction, onReact }) => {
  const [open, setOpen] = useState(false);
  const summary = typeof reactions === 'object' && !Array.isArray(reactions)
    ? reactions
    : summarizeReactions(reactions);

  return (
    <div className="flex items-center gap-1 flex-wrap">
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
      return message.reactions;
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
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
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

        <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>

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
          </div>
        )}
      </div>

      {message.replies && message.replies.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowReplies(s => !s)}
            className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 ml-6 mb-1"
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


const DiscussionForum = ({ eventId, forceOrganizer = false }) => {
  const { user, organizer } = useAuth();
  const { socket, connected } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [posting, setPosting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  const currentUserId = user?._id || organizer?._id;
  const isOrganizer = forceOrganizer || !!organizer;

  const addToast = useCallback((text, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await discussionAPI.getMessages(eventId);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      addToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  }, [eventId, addToast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const response = await discussionAPI.getUnreadCount(eventId);
        setUnreadCount(response.data.count || 0);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };
    fetchUnread();
  }, [eventId]);

  useEffect(() => {
    if (!socket || !eventId) {
      console.log('Socket not ready or no eventId');
      return;
    }

    socket.emit('join-event', eventId);
    console.log('Joined event room:', eventId);

    const handleNewMessage = (newMsg) => {
      setMessages(prev => {
        if (prev.some(m => m._id === newMsg._id)) {
          return prev;
        }
        const hasOptimistic = prev.some(
          m => m._id?.toString().startsWith('temp-') &&
               m.content === newMsg.content &&
               (m.author === newMsg.author?._id || m.author === newMsg.author)
        );
        if (hasOptimistic) {
          return prev.map(m =>
            m._id?.toString().startsWith('temp-') &&
            m.content === newMsg.content &&
            (m.author === newMsg.author?._id || m.author === newMsg.author)
              ? { ...newMsg, replies: m.replies || [], replyCount: m.replyCount || 0 }
              : m
          );
        }
        return [...prev, newMsg];
      });
      scrollToBottom();
      
      if (newMsg.author !== currentUserId && newMsg.author?._id !== currentUserId) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleNewReply = ({ parentId, reply }) => {
      setMessages(prev => prev.map(m => {
        if (m._id === parentId) {
          if (m.replies && m.replies.some(r => r._id === reply._id)) {
            
            return m;
          }
          return {
            ...m,
            replies: [...(m.replies || []), reply],
            replyCount: (m.replyCount || 0) + 1,
          };
        }
        return m;
      }));
      
      if (reply.author !== currentUserId && reply.author?._id !== currentUserId) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };


    const handleMessagePinned = ({ messageId, isPinned }) => {
      setMessages(prev => {
        const updated = prev.map(m => 
          m._id === messageId ? { ...m, isPinned } : m
        );
        return updated.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          if (a.isAnnouncement && !b.isAnnouncement) return -1;
          if (!a.isAnnouncement && b.isAnnouncement) return 1;
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
      });
    };

    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, reactions } : m
      ));
    };


    const handleAnnouncement = ({ content, authorName }) => {
      addToast(`${authorName}: ${content.slice(0, 80)}${content.length > 80 ? '…' : ''}`, 'announcement');
    };

    socket.on('new-message', handleNewMessage);
    socket.on('new-reply', handleNewReply);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('message-pinned', handleMessagePinned);
    socket.on('reaction-updated', handleReactionUpdated);
    socket.on('announcement', handleAnnouncement);

    return () => {
      socket.emit('leave-event', eventId);
      socket.off('new-message', handleNewMessage);
      socket.off('new-reply', handleNewReply);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('message-pinned', handleMessagePinned);
      socket.off('reaction-updated', handleReactionUpdated);
      socket.off('announcement', handleAnnouncement);
    };
  }, [socket, eventId, scrollToBottom, addToast, currentUserId]);

  useEffect(() => {
    if (unreadCount > 0) {
      discussionAPI.markRead(eventId).catch(() => {});
      setUnreadCount(0);
    }
  }, [unreadCount, eventId]);

  const handlePost = async () => {
    if (!newMessage.trim() || posting) return;
    
    const optimisticMessage = {
      _id: `temp-${Date.now()}`, 
      content: newMessage.trim(),
      authorName: isOrganizer ? (organizer?.name || 'Organizer') : `${user?.firstName} ${user?.lastName}`,
      authorModel: isOrganizer ? 'Organizer' : 'User',
      author: currentUserId,
      isAnnouncement,
      isPinned: false,
      reactions: [],
      replies: [],
      replyCount: 0,
      createdAt: new Date().toISOString(),
    };
    
    setPosting(true);
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();
    
    try {
      const response = await discussionAPI.postMessage(eventId, {
        content: messageContent,
        isAnnouncement,
      });
      
      setMessages(prev => {
        const hasTemp = prev.some(m => m._id === optimisticMessage._id);
        if (hasTemp) {
          return prev.map(m =>
            m._id === optimisticMessage._id ? { ...response.data.message, replies: [], replyCount: 0 } : m
          );
        }
        return prev;
      });
      
      setIsAnnouncement(false);
    } catch (err) {
      console.error('Error posting message:', err);
      setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
      setNewMessage(messageContent); 
      addToast(err.response?.data?.message || 'Failed to post message', 'error');
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (parentId, content) => {
    try {
      const response = await discussionAPI.postReply(parentId, { content });
      
      setMessages(prev => prev.map(m => {
        if (m._id === parentId) {
          return {
            ...m,
            replies: [...(m.replies || []), response.data.reply],
            replyCount: (m.replyCount || 0) + 1,
          };
        }
        return m;
      }));
      
    } catch (err) {
      console.error('Error posting reply:', err);
      addToast('Failed to post reply', 'error');
      throw err; 
    }
  };

  const handleDelete = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    
    const previousMessages = [...messages];
    setMessages(prev => prev.filter(m => m._id !== messageId));
    
    try {
      await discussionAPI.deleteMessage(messageId);
    } catch (err) {
      console.error('Error deleting message:', err);
      setMessages(previousMessages);
      addToast('Failed to delete message', 'error');
    }
  };

  const handlePin = async (messageId) => {
    const previousMessages = [...messages];
    setMessages(prev => {
      const updated = prev.map(m => 
        m._id === messageId ? { ...m, isPinned: !m.isPinned } : m
      );
      return updated.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    });
    
    try {
      await discussionAPI.pinMessage(messageId);
    } catch (err) {
      console.error('Error pinning message:', err);
      setMessages(previousMessages);
      addToast('Failed to pin message', 'error');
    }
  };

  const handleReact = async (messageId, emoji) => {
    const previousMessages = [...messages];
    setMessages(prev => prev.map(m => {
      if (m._id === messageId) {
        const reactions = Array.isArray(m.reactions) ? [...m.reactions] : [];
        const existingIdx = reactions.findIndex(
          r => (r.user === currentUserId || r.user?._id === currentUserId) && r.emoji === emoji
        );
        
        if (existingIdx >= 0) {
          reactions.splice(existingIdx, 1);
        } else {
          const otherIdx = reactions.findIndex(
            r => r.user === currentUserId || r.user?._id === currentUserId
          );
          if (otherIdx >= 0) reactions.splice(otherIdx, 1);
          reactions.push({ 
            user: currentUserId, 
            userModel: isOrganizer ? 'Organizer' : 'User',
            emoji 
          });
        }
        
        return { ...m, reactions };
      }
      return m;
    }));
    
    try {
      await discussionAPI.reactToMessage(messageId, { emoji });
    } catch (err) {
      console.error('Error reacting to message:', err);
      setMessages(previousMessages);
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

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {connected ? (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-medium">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-yellow-600">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="font-medium">Reconnecting...</span>
            </div>
          )}
        </div>

        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            <FiBell size={12} />
            {unreadCount} new {unreadCount === 1 ? 'message' : 'messages'}
          </div>
        )}
      </div>

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
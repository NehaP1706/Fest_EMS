import { useState, useEffect } from 'react';
import { discussionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socket';
import { FiSend, FiMessageCircle } from 'react-icons/fi';

const DiscussionForum = ({ eventId }) => {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
    
    // Connect socket
    socketService.connect();
    socketService.joinEventRoom(eventId);
    
    // Listen for new messages
    socketService.onNewMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketService.leaveEventRoom(eventId);
      socketService.off('new-message');
    };
  }, [eventId]);

  const fetchMessages = async () => {
    try {
      const response = await discussionAPI.getMessages(eventId);
      setMessages(response.data.discussions || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await discussionAPI.postMessage(eventId, { message: newMessage });
      setNewMessage('');
    } catch (error) {
      alert('Failed to send message');
    }
  };

  return (
    <div className="space-y-4">
      {/* Messages List */}
      <div className="max-h-96 overflow-y-auto space-y-3 mb-4">
        {loading ? (
          <p className="text-gray-600 text-center">Loading...</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <FiMessageCircle className="mx-auto text-4xl mb-2" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`p-3 rounded-lg ${
                msg.isAnnouncement
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">
                    {msg.author.authorName}
                    {msg.author.authorType === 'organizer' && (
                      <span className="ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded">
                        Organizer
                      </span>
                    )}
                  </p>
                  <p className="text-gray-700 mt-1">{msg.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="input flex-1"
          maxLength={1000}
        />
        <button type="submit" className="btn-primary flex items-center">
          <FiSend className="mr-2" />
          Send
        </button>
      </form>
    </div>
  );
};

export default DiscussionForum;
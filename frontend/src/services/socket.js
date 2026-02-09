import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token || localStorage.getItem('token'),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
    return this.socket;
  }

  // Setup default event listeners
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
      console.log('Socket disconnected manually');
    }
  }

  // Join event discussion room
  joinEventRoom(eventId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-event', eventId);
      console.log(`Joined event room: ${eventId}`);
    } else {
      console.warn('Socket not connected. Cannot join room.');
    }
  }

  // Leave event discussion room
  leaveEventRoom(eventId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-event', eventId);
      console.log(`Left event room: ${eventId}`);
    }
  }

  // Listen for new messages in discussion
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback);
      this.eventListeners.set('new-message', callback);
    }
  }

  // Listen for message updates
  onMessageUpdate(callback) {
    if (this.socket) {
      this.socket.on('message-updated', callback);
      this.eventListeners.set('message-updated', callback);
    }
  }

  // Listen for message deletion
  onMessageDelete(callback) {
    if (this.socket) {
      this.socket.on('message-deleted', callback);
      this.eventListeners.set('message-deleted', callback);
    }
  }

  // Listen for reactions
  onReaction(callback) {
    if (this.socket) {
      this.socket.on('reaction-added', callback);
      this.eventListeners.set('reaction-added', callback);
    }
  }

  // Listen for typing indicators
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
      this.eventListeners.set('user-typing', callback);
    }
  }

  // Emit typing event
  emitTyping(eventId, userName) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { eventId, userName });
    }
  }

  // Custom event listener
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.eventListeners.set(event, callback);
    }
  }

  // Remove event listener
  off(event) {
    if (this.socket && this.eventListeners.has(event)) {
      const callback = this.eventListeners.get(event);
      this.socket.off(event, callback);
      this.eventListeners.delete(event);
    }
  }

  // Emit custom event
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event.');
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Get socket ID
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

// Export individual methods for convenience
export const {
  connect,
  disconnect,
  joinEventRoom,
  leaveEventRoom,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
  onReaction,
  onUserTyping,
  emitTyping,
  on,
  off,
  emit,
  getConnectionStatus,
  getSocketId,
} = socketService;

// Usage example in a React component:
/*
import { useEffect } from 'react';
import socketService from '../services/socket';

function DiscussionForum({ eventId }) {
  useEffect(() => {
    // Connect socket
    const token = localStorage.getItem('token');
    socketService.connect(token);

    // Join event room
    socketService.joinEventRoom(eventId);

    // Listen for new messages
    socketService.onNewMessage((message) => {
      console.log('New message:', message);
      // Update UI with new message
    });

    // Cleanup
    return () => {
      socketService.leaveEventRoom(eventId);
      socketService.off('new-message');
    };
  }, [eventId]);

  return (
    <div>
      // Your discussion forum UI
    </div>
  );
}
*/
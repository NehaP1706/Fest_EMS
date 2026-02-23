import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

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

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
      console.log('Socket disconnected manually');
    }
  }

  joinEventRoom(eventId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-event', eventId);
      console.log(`Joined event room: ${eventId}`);
    } else {
      console.warn('Socket not connected. Cannot join room.');
    }
  }

  leaveEventRoom(eventId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-event', eventId);
      console.log(`Left event room: ${eventId}`);
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback);
      this.eventListeners.set('new-message', callback);
    }
  }

  onMessageUpdate(callback) {
    if (this.socket) {
      this.socket.on('message-updated', callback);
      this.eventListeners.set('message-updated', callback);
    }
  }

  onMessageDelete(callback) {
    if (this.socket) {
      this.socket.on('message-deleted', callback);
      this.eventListeners.set('message-deleted', callback);
    }
  }

  onReaction(callback) {
    if (this.socket) {
      this.socket.on('reaction-added', callback);
      this.eventListeners.set('reaction-added', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user-typing', callback);
      this.eventListeners.set('user-typing', callback);
    }
  }

  emitTyping(eventId, userName) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { eventId, userName });
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.eventListeners.set(event, callback);
    }
  }

  off(event) {
    if (this.socket && this.eventListeners.has(event)) {
      const callback = this.eventListeners.get(event);
      this.socket.off(event, callback);
      this.eventListeners.delete(event);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event.');
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  getSocketId() {
    return this.socket?.id || null;
  }
}

const socketService = new SocketService();

export default socketService;

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
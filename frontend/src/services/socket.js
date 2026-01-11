import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

// Create socket instance (don't connect yet)
export const socket = io(SOCKET_URL, {
  autoConnect: false
});

// Connect to server
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

// Disconnect from server
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Join a document room
export const joinDocument = (documentId) => {
  socket.emit('join-document', documentId);
};

// Leave a document room
export const leaveDocument = (documentId) => {
  socket.emit('leave-document', documentId);
};
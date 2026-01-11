const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
require('dotenv').config();

const userRoutes = require('./routes/userRoute');
const documentRoutes = require('./routes/documentRoute');
const annotationRoutes = require('./routes/annotationRoute');

const app = express();

// Create HTTP server (needed for Socket.IO)
const server = http.createServer(app);

// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://collaborative-annotation-system.vercel.app'
];

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'DELETE']
  }
});

connectDB();

// CORS for Express
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  credentials: true
}));

app.use(express.json());

// Make io available in controllers
app.set('io', io);

app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/annotations', annotationRoutes);

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // User joins document room
  socket.on('join-document', (documentId) => {
    socket.join(documentId);
    console.log(`User joined room: ${documentId}`);
  });

  // User leaves document room
  socket.on('leave-document', (documentId) => {
    socket.leave(documentId);
    console.log(`User left room: ${documentId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
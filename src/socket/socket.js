// backend/src/socket/socket.js
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const onlineUsers = new Map();

const initializeSocket = (io) => {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Track online users
    onlineUsers.set(socket.userId, socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));

    // Join personal room
    socket.join(`user_${socket.userId}`);

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, message } = data;

        // Save to database
        const chat = await prisma.chat.create({
          data: {
            senderId: socket.userId,
            receiverId: parseInt(receiverId),
            message
          },
          include: {
            sender: {
              select: { id: true, name: true, avatar: true }
            },
            receiver: {
              select: { id: true, name: true, avatar: true }
            }
          }
        });

        // Send to receiver if online
        io.to(`user_${receiverId}`).emit('receive_message', chat);

        // Send confirmation back to sender
        socket.emit('message_sent', chat);
      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing', (data) => {
      io.to(`user_${data.receiverId}`).emit('user_typing', {
        userId: socket.userId
      });
    });

    socket.on('stop_typing', (data) => {
      io.to(`user_${data.receiverId}`).emit('user_stop_typing', {
        userId: socket.userId
      });
    });

    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        await prisma.chat.updateMany({
          where: {
            senderId: parseInt(data.senderId),
            receiverId: socket.userId,
            isRead: false
          },
          data: { isRead: true }
        });

        io.to(`user_${data.senderId}`).emit('messages_read', {
          readBy: socket.userId
        });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      onlineUsers.delete(socket.userId);
      io.emit('online_users', Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = { initializeSocket };
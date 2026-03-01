// backend/src/controllers/chat.controller.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get chat history between two users
const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await prisma.chat.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: parseInt(userId) },
          { senderId: parseInt(userId), receiverId: currentUserId }
        ]
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        },
        receiver: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    // Mark messages as read
    await prisma.chat.updateMany({
      where: {
        senderId: parseInt(userId),
        receiverId: currentUserId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history.'
    });
  }
};

// Get all chat conversations for admin
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get distinct users who have chatted with admin
    const messages = await prisma.chat.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        receiver: {
          select: { id: true, name: true, email: true, avatar: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Extract unique conversation partners
    const conversationMap = new Map();
    messages.forEach(msg => {
      const partner = msg.senderId === currentUserId ? msg.receiver : msg.sender;
      if (!conversationMap.has(partner.id)) {
        conversationMap.set(partner.id, {
          user: partner,
          lastMessage: msg.message,
          timestamp: msg.timestamp,
          unreadCount: 0
        });
      }
    });

    // Count unread messages per conversation
    for (const [partnerId, conv] of conversationMap) {
      const unread = await prisma.chat.count({
        where: {
          senderId: partnerId,
          receiverId: currentUserId,
          isRead: false
        }
      });
      conv.unreadCount = unread;
    }

    res.json({
      success: true,
      data: Array.from(conversationMap.values())
    });
  } catch (error) {
    console.error('Conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations.'
    });
  }
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    const chat = await prisma.chat.create({
      data: {
        senderId,
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

    res.status(201).json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message.'
    });
  }
};

// Get admin user (for users to chat with)
const getAdminUser = async (req, res) => {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 2 },
      select: { id: true, name: true, email: true, avatar: true }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No admin found.'
      });
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin.'
    });
  }
};

module.exports = { getChatHistory, getConversations, sendMessage, getAdminUser };
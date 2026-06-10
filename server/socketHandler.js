import jwt from "jsonwebtoken";

// Map to store connected users: { userId: socketId }
const onlineUsers = new Map();

const parseCookieValue = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
};

// JWT Authentication Middleware (similar to protect, but for sockets)
const socketAuthMiddleware = (socket, next) => {
  const token =
    socket.handshake.auth.token ||
    parseCookieValue(socket.handshake.headers.cookie, "access_token");

  if (!token) {
    return next(new Error("Authentication error: No token provided."));
  }

  try {
    // 2. Verify and decode the JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach user info to the socket instance
    socket.userId = decoded.userId;
    socket.userType = decoded.userType;

    // Note: For full security, you would look up the user in the DB here
    // to check for account lockouts, but we skip it for performance.

    next();
  } catch (error) {
    // Handle token expiration or invalid signature
    if (error.name === "TokenExpiredError") {
      return next(new Error("Authentication error: Token expired."));
    }
    return next(new Error("Authentication error: Invalid token."));
  }
};

// Module-level io reference set by initSocketServer so emitNewMessage can use it
let _io = null;

/**
 * Returns true if the given userId currently has an active socket connection.
 * Used by the REST layer to decide whether to send an email notification on
 * new activity (skip email when the recipient is live in the app).
 */
export const isUserOnline = (userId) => onlineUsers.has(userId);

/**
 * Initializes the Socket.io server and registers all event handlers.
 * @param {Server} io - The Socket.io Server instance
 */
export const initSocketServer = (io) => {
  _io = io;
  // Apply authentication middleware to all incoming connections
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.id})`);

    // [Task: Handle online status]
    // Store the user ID -> socket ID mapping
    onlineUsers.set(socket.userId, socket.id);

    // Broadcast the updated online status to everyone (excluding the user who just connected)
    io.emit("user:online", { userId: socket.userId });

    // --- Typing Indicators (Task: Implement typing start/stop events) ---

    socket.on("typing:start", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        // Emit the event only to the receiver
        io.to(receiverSocketId).emit("typing:start", {
          senderId: socket.userId,
        });
      }
    });

    socket.on("typing:stop", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        // Emit the event only to the receiver
        io.to(receiverSocketId).emit("typing:stop", {
          senderId: socket.userId,
        });
      }
    });

    // --- Read Receipts (Task: Emit read receipt events) ---

    socket.on("message:read", ({ senderId, conversationId }) => {
      // Find the sender's socket ID (the person who sent the messages we just read)
      const senderSocketId = onlineUsers.get(senderId);

      // Emit the receipt back to the sender
      if (senderSocketId) {
        io.to(senderSocketId).emit("message:read:receipt", {
          readerId: socket.userId, // The person who read the message
          conversationId: conversationId,
        });
      }
    });

    // [Task: Handle offline status]
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Remove user from online map
      onlineUsers.delete(socket.userId);

      // Broadcast the offline status
      io.emit("user:offline", { userId: socket.userId });
    });
  });
};

/**
 * Public function called by the REST API controller (messageController.js)
 * to send a new message in real-time.
 * [Task: Emit new message events]
 */
export const emitNewMessage = (messageData) => {
  if (!_io) return;

  const receiverId = messageData.receiver_id;
  const senderId = messageData.sender_id;

  const receiverSocketId = onlineUsers.get(receiverId);
  if (receiverSocketId) {
    _io.to(receiverSocketId).emit("message:new", messageData);
  }

  const senderSocketId = onlineUsers.get(senderId);
  if (senderSocketId) {
    _io.to(senderSocketId).emit("message:new", messageData);
  }
};

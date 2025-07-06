// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // To give each message a unique ID

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store users and message history in memory
const users = {};
const messageHistory = [];

app.use(express.static(__dirname)); // Serve static files from the root directory (for index.html)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (username) => {
    socket.username = username;
    users[socket.id] = username;
    
    // Send existing chat history to the new user
    socket.emit('chat history', messageHistory);

    // Notify others and update the user list for everyone
    socket.broadcast.emit('system message', `${username} has joined the chat.`);
    io.emit('update users', Object.values(users));
  });

  socket.on('chat message', (msg) => {
    if (!socket.username) return; // Ignore messages from users who haven't joined

    const messageData = {
        id: uuidv4(), // Give each message a unique ID for deletion
        username: socket.username,
        msg: msg
    };
    messageHistory.push(messageData);
    if(messageHistory.length > 100) {
        messageHistory.shift(); // Keep history capped at 100 messages
    }

    io.emit('chat message', messageData);
  });
  
  // Handle message deletion from a client
  socket.on('delete message', (messageId) => {
      const messageIndex = messageHistory.findIndex(msg => msg.id === messageId);
      
      if (messageIndex > -1) {
          // Security check: only the original sender can delete the message
          if (messageHistory[messageIndex].username === socket.username) {
              messageHistory.splice(messageIndex, 1);
              io.emit('message deleted', messageId); // Notify all clients to remove the message
          }
      }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('system message', `${socket.username} has left the chat.`);
      delete users[socket.id];
      io.emit('update users', Object.values(users));
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

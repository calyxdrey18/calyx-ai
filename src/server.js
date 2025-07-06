// src/server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store users and message history in memory
const users = {};
const messageHistory = [];

// --- CRITICAL FIX ---
// Serve static files (like CSS or client-side JS if you had any) from the `src` directory
app.use(express.static(path.join(__dirname))); 

// When the root is requested, send the index.html file from the same directory
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', (username) => {
    socket.username = username;
    users[socket.id] = username;
    
    socket.emit('chat history', messageHistory);
    socket.broadcast.emit('system message', `${username} has joined the chat.`);
    io.emit('update users', Object.values(users));
  });

  socket.on('chat message', (msg) => {
    if (!socket.username) return;

    const messageData = {
        id: uuidv4(),
        username: socket.username,
        msg: msg
    };
    messageHistory.push(messageData);
    if(messageHistory.length > 100) {
        messageHistory.shift();
    }
    io.emit('chat message', messageData);
  });
  
  socket.on('delete message', (messageId) => {
      const messageIndex = messageHistory.findIndex(msg => msg.id === messageId);
      if (messageIndex > -1) {
          if (messageHistory[messageIndex].username === socket.username) {
              messageHistory.splice(messageIndex, 1);
              io.emit('message deleted', messageId);
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

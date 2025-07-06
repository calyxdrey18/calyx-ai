// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // To give each message a unique ID

const app =express();
const server = http.createServer(app);
const io = new Server(server);

// Store users and message history
const users = {};
const messageHistory = [];

app.use(express.static(path.join(__dirname))); // Serve the index.html file

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (username) => {
    socket.username = username;
    users[socket.id] = username;
    
    // Send history to new user
    socket.emit('chat history', messageHistory);

    // Notify others and update user list
    socket.broadcast.emit('system message', `${username} has joined the chat.`);
    io.emit('update users', Object.values(users));
  });

  socket.on('chat message', (msg) => {
    const messageData = {
        id: uuidv4(), // Give each message a unique ID
        username: socket.username,
        msg: msg
    };
    messageHistory.push(messageData);
    if(messageHistory.length > 100) messageHistory.shift(); // Keep history to 100 messages

    io.emit('chat message', messageData);
  });
  
  // Handle message deletion
  socket.on('delete message', (messageId) => {
      const messageIndex = messageHistory.findIndex(msg => msg.id === messageId);
      if (messageIndex > -1) {
          // Security check: only the sender can delete
          if (messageHistory[messageIndex].username === socket.username) {
              messageHistory.splice(messageIndex, 1);
              io.emit('message deleted', messageId); // Notify all clients
          }
      }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('system message', `${socket.username} has left the chat.`);
      delete users[socket.id];
      io.emit('update users', Object.values(users));
    }
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on *:${PORT}`);
});
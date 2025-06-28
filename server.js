// server.js - UPDATED
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static('public'));

let users = {};
// --- NEW: Store the last 100 messages ---
const messageHistory = [];
const MAX_HISTORY_LENGTH = 100;

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // When a user joins with a username
    socket.on('join', (username) => {
        users[socket.id] = username;
        socket.username = username;

        // --- NEW: Send message history to the newly connected user ---
        socket.emit('load history', messageHistory);

        // Broadcast to all other users that a new person has joined
        socket.broadcast.emit('system message', `${username} has joined the chat.`);
        
        // Update the user list for everyone
        io.emit('update users', Object.values(users));
    });

    // When a chat message is received
    socket.on('chat message', (msg) => {
        // Prevent chat if user hasn't joined yet
        if (!socket.username) return;

        const messageData = {
            username: socket.username,
            msg: msg
        };

        // --- NEW: Add message to history ---
        messageHistory.push(messageData);
        // If history is too long, remove the oldest message
        if (messageHistory.length > MAX_HISTORY_LENGTH) {
            messageHistory.shift();
        }

        // Broadcast the message to everyone, including the sender
        io.emit('chat message', messageData);
    });

    // When a user disconnects
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        if (users[socket.id]) {
            const username = users[socket.id];
            delete users[socket.id];
            // Broadcast that the user has left
            socket.broadcast.emit('system message', `${username} has left the chat.`);
            // Update the user list for the remaining users
            io.emit('update users', Object.values(users));
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

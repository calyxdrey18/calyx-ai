// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let users = {};
let messageHistory = [];
const HISTORY_LIMIT = 50;

// Helper to add a message to history
const addMessageToHistory = (messageObject) => {
    messageHistory.push(messageObject);
    if (messageHistory.length > HISTORY_LIMIT) {
        messageHistory.shift(); // Remove the oldest message
    }
};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (username) => {
        users[socket.id] = username;
        socket.username = username;

        // Send existing chat history to the new user
        socket.emit('load history', messageHistory);
        
        const systemMessage = {
            type: 'system',
            msg: `${username} has joined the chat.`,
            timestamp: new Date()
        };
        addMessageToHistory(systemMessage);
        socket.broadcast.emit('system message', systemMessage);
        
        io.emit('update users', Object.values(users));
    });

    socket.on('chat message', (msg) => {
        const messageObject = {
            username: socket.username,
            msg: msg,
            timestamp: new Date()
        };
        addMessageToHistory(messageObject);
        io.emit('chat message', messageObject);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        if (users[socket.id]) {
            const username = users[socket.id];
            delete users[socket.id];
            
            const systemMessage = {
                type: 'system',
                msg: `${username} has left the chat.`,
                timestamp: new Date()
            };
            addMessageToHistory(systemMessage);
            socket.broadcast.emit('system message', systemMessage);

            io.emit('update users', Object.values(users));
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

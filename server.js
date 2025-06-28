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

const addMessageToHistory = (messageObject) => {
    messageHistory.push(messageObject);
    if (messageHistory.length > HISTORY_LIMIT) {
        messageHistory.shift();
    }
};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (username) => {
        if (Object.values(users).includes(username)) {
            socket.emit('join error', 'This username is already taken. Please choose another.');
            return;
        }

        users[socket.id] = username;
        socket.username = username;
        
        socket.emit('join success');
        socket.emit('load history', messageHistory);
        
        const systemMessage = {
            id: Date.now() + Math.random(), // Give system messages a unique ID too
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
            id: Date.now() + Math.random(), // Unique ID for each message
            senderSocketId: socket.id, // Store sender's ID for deletion check
            username: socket.username,
            msg: msg,
            timestamp: new Date()
        };
        addMessageToHistory(messageObject);
        io.emit('chat message', messageObject);
    });

    // --- NEW: Handle message deletion ---
    socket.on('delete message', (messageId) => {
        const messageIndex = messageHistory.findIndex(msg => msg.id === messageId);

        if (messageIndex !== -1) {
            // Authorization check: Only the original sender can delete
            if (messageHistory[messageIndex].senderSocketId === socket.id) {
                messageHistory.splice(messageIndex, 1); // Remove from history
                io.emit('message deleted', messageId); // Notify all clients to remove it
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        if (users[socket.id]) {
            const username = users[socket.id];
            delete users[socket.id];
            
            const systemMessage = {
                id: Date.now() + Math.random(),
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

const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const { decodeToken } = require('../middleware/JWTAction');

const app = express();

// Socket connection
const server = http.createServer(app);

const io = new Server(server,{
    cors :{
        origin :'*',
        credentials: true,
        methods: ["GET", "POST"]
    }
});

const userSocketMap = {};
const onlineUsers = new Set();

const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

io.on('connection', (socket) => {
    console.log('Connected User:', socket.id);
    
    const token = socket.handshake.query.userId;
    console.log('tk',token)

    // Check if token is provided
    if (token) {
        const user = decodeToken(token);

        if (user) {

            userSocketMap[user.id] = socket.id; 
            onlineUsers.add(user.id);
            socket.join(user.id);
            io.emit('onlineUser', Array.from(onlineUsers));
        } else {
            socket.disconnect(); // Disconnect socket if the token is invalid
        }
    } else {
        console.error('No token provided');
        socket.disconnect(); // Disconnect socket if no token is provided
    }

    // Disconnect event
    socket.on('disconnect', () => {
        const userId = Object.keys(userSocketMap).find(id => userSocketMap[id] === socket.id);
        
        if (userId) {
            onlineUsers.delete(userId);
            delete userSocketMap[userId]; // Remove user from the map
            console.log('Disconnected User:', socket.id);
            io.emit('onlineUser', Array.from(onlineUsers));
        }
    });
});

module.exports = {
    app,
    server,
    getReceiverSocketId
    ,io
};

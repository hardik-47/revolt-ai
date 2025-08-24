// src/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const { startChat } = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory (for our frontend)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Create a standard HTTP server from our Express app
const server = http.createServer(app);

// Attach a WebSocket server to the HTTP server
const wss = new WebSocketServer({ server });

// Handle new WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected via WebSocket');

  // Pass the new connection to our Gemini service to handle the chat
  startChat(ws);
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server is live at http://localhost:${PORT}`);
});
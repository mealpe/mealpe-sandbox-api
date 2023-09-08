
var express = require("express");
var router = express.Router();
const WebSocket = require('ws');

// const server = new WebSocket.Server({ port: 8080 }); 
// var supabaseInstance = require("../services/supabaseClient").supabase;

// server.on('connection', (socket) => {
//   console.log('Client connected');
//    message ="something"

//   socket.on('message', (message) => {
//     console.log(`Received: ${message}`);

//     setTimeout(() => {
//         console.log("connected")
//         socket.send("Data")
//     }, 5000);

//     socket.send(`Server received: ${message}`);
//   });

//   socket.on('close', () => {
//     console.log('Client disconnected');
//   });
// });


module.exports = router;

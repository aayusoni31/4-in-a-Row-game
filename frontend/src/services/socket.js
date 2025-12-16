import { io } from "socket.io-client";

// Connect to your Node.js backend
const socket = io("http://localhost:3001");

export default socket;

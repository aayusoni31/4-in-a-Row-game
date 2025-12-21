// Connecting Node.js backend imp step
// here the websocket connection is established
import { io } from "socket.io-client";

// Use the Render link from Vercel Envs, or localhost for dev
const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

const socket = io(URL, {
  autoConnect: true,
});

export default socket;

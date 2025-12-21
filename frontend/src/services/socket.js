import { io } from "socket.io-client";

// Use the Render link from Vercel Envs, or localhost for dev
const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

const socket = io(URL, {
  autoConnect: true,
  // ADD THIS: It forces the browser to use a direct websocket connection
  // which is much more stable on Render/Vercel.
  transports: ["websocket"],
  upgrade: false,
});

export default socket;

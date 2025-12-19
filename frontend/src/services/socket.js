// Connecting Node.js backend imp step
// here the websocket connection is established
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export default socket;

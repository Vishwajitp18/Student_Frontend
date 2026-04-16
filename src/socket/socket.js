import { io } from "socket.io-client";

const socket = io("https://bus-gps-backend-1irw.onrender.com");

export default socket;
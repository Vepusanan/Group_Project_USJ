import { io } from "socket.io-client";

function resolveSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl?.startsWith("http")) {
    return apiUrl.replace(/\/api\/?$/, "");
  }

  // Same-origin deploy (Railway monolith): connect to the current host.
  if (import.meta.env.PROD) {
    return undefined;
  }

  return "http://localhost:5001";
}

const SOCKET_URL = resolveSocketUrl();

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export default { connectSocket, disconnectSocket, getSocket };

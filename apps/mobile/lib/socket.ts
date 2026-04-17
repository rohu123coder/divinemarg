import { io } from "socket.io-client";

export const socket = io("https://divinemarg.onrender.com", {
  transports: ["websocket"],
  autoConnect: false,
});

export const connectSocket = (token: string) => {
  socket.auth = { token };
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

import type { Server } from "socket.io";

let io: Server | null = null;

export function setSocketServer(server: Server): void {
  io = server;
}

export function getSocketServer(): Server {
  if (!io) {
    throw new Error("Socket server not initialized");
  }
  return io;
}

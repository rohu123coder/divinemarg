import { mkdirSync } from "node:fs";
import path from "node:path";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { connect as connectRedis } from "./lib/redis.js";
import { adminRouter } from "./routes/admin.js";
import { astrologersRouter } from "./routes/astrologers.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { setSocketServer } from "./socket/io.js";
import { registerSocketHandlers } from "./socket/index.js";
import { sessionsRouter } from "./routes/sessions.js";
import { usersRouter } from "./routes/users.js";
import { walletRouter } from "./routes/wallet.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const uploadDir = path.join(process.cwd(), "uploads");
mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/astrologers", astrologersRouter);
app.use("/api/chat", chatRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/wallet", walletRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  pingTimeout: 60000,
  pingInterval: 25000,
});

setSocketServer(io);
registerSocketHandlers(io);

const port = Number(process.env.PORT) || 4000;

await connectRedis();

httpServer.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

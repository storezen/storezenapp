import express, { type Express, type Request, type Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";
import { corsMiddleware } from "./middlewares/cors";
import { initializeWhatsAppAutomation, initializeWebSocket } from "./services/orders";
import { initializeCourierAdapters } from "./services/courierRegistry";

const app: Express = express();
export default app;
const httpServer = createServer(app);

// Initialize WebSocket for real-time order updates
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  path: "/socket.io",
});

// Initialize modules on startup
async function initializeModules() {
  try {
    // Initialize WhatsApp automation (event listeners)
    initializeWhatsAppAutomation();
    if (process.env.NODE_ENV !== "production") {
      logger.info("[App] WhatsApp automation initialized");
    }

    // Initialize courier adapters from environment
    initializeCourierAdapters({
      postexApiKey: process.env.POSTEX_API_KEY,
      postexApiUrl: process.env.POSTEX_API_URL,
      defaultCourier: process.env.DEFAULT_COURIER || "generic",
    });
    if (process.env.NODE_ENV !== "production") {
      logger.info("[App] Courier adapters initialized");
    }

    // Initialize real-time WebSocket sync
    initializeWebSocket(httpServer);
    if (process.env.NODE_ENV !== "production") {
      logger.info("[App] WebSocket server initialized");
    }
  } catch (error) {
    logger.error({ err: error }, "[App] Module initialization error");
  }
}

// Run initialization
initializeModules();

// Socket.io connection handling with order event support
io.on("connection", (socket) => {
  if (process.env.NODE_ENV !== "production") {
    logger.info({ socketId: socket.id }, "[Socket] Client connected");
  }

  // Join store room for order broadcasts
  socket.on("join_store", (storeId: string) => {
    socket.join(`store_${storeId}`);
    if (process.env.NODE_ENV !== "production") {
      logger.info({ socketId: socket.id, storeId }, "[Socket] Joined store room");
    }
  });

  // Subscribe to specific order for tracking
  socket.on("subscribe_order", (orderId: string) => {
    socket.join(`order_${orderId}`);
    if (process.env.NODE_ENV !== "production") {
      logger.info({ socketId: socket.id, orderId }, "[Socket] Subscribed to order");
    }
  });

  socket.on("unsubscribe_order", (orderId: string) => {
    socket.leave(`order_${orderId}`);
  });

  // Heartbeat for session tracking
  socket.on("heartbeat", (data: { storeId: string; sessionId: string }) => {
    socket.join(`session_${data.sessionId}`);
  });

  socket.on("disconnect", (reason) => {
    if (process.env.NODE_ENV !== "production") {
      logger.info({ socketId: socket.id, reason }, "[Socket] Client disconnected");
    }
  });
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  const frontendUrl = process.env.FRONTEND_ORIGINS?.split(',')[0]?.trim() || 'http://localhost:3001';
  res.redirect(frontendUrl);
});

app.use("/api", router);

export { httpServer };
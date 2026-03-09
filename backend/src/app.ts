import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { authPlugin } from "./plugins/auth.js";
import { swaggerPlugin } from "./plugins/swagger.js";
import { healthRoutes } from "./modules/health/routes.js";
import { authRoutes } from "./modules/auth/routes.js";
import { menuRoutes } from "./modules/menu/routes.js";
import { ordersRoutes } from "./modules/orders/routes.js";
import { analyticsRoutes } from "./modules/analytics/routes.js";
import { inventoryRoutes } from "./modules/inventory/routes.js";
import { loyaltyRoutes } from "./modules/loyalty/routes.js";
import { gamesRoutes } from "./modules/games/routes.js";
import { aiRoutes } from "./modules/ai/routes.js";
import { integrationRoutes } from "./modules/integrations/routes.js";

export function buildApp() {
  const allowedOrigins = new Set([
    env.CUSTOMER_APP_ORIGIN,
    env.COMPANY_APP_ORIGIN,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ]);

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "development"
          ? {
              target: "pino-pretty"
            }
          : undefined
    }
  });

  app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed`), false);
    },
  });
  app.register(swaggerPlugin);
  app.register(authPlugin);

  app.register(healthRoutes, { prefix: "/health" });
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(menuRoutes, { prefix: "/api/menu" });
  app.register(ordersRoutes, { prefix: "/api/orders" });
  app.register(analyticsRoutes, { prefix: "/api/analytics" });
  app.register(inventoryRoutes, { prefix: "/api/inventory" });
  app.register(loyaltyRoutes, { prefix: "/api/loyalty" });
  app.register(gamesRoutes, { prefix: "/api/games" });
  app.register(aiRoutes, { prefix: "/api/ai" });
  app.register(integrationRoutes, { prefix: "/api/integrations" });

  return app;
}

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
import { customerRoutes } from "./modules/customer/routes.js";
import { tablesRoutes } from "./modules/tables/routes.js";
import { digitalTwinRoutes } from "./modules/digitalTwin/routes.js";
import { marketingRoutes } from "./modules/marketing/routes.js";
import { queueRoutes } from "./modules/queue/routes.js";
function parseCommaSeparatedOrigins(input) {
    if (!input)
        return [];
    return input
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}
export function buildApp() {
    const configuredOrigins = [
        env.CUSTOMER_APP_ORIGIN,
        env.COMPANY_APP_ORIGIN,
        env.QUEUE_APP_ORIGIN,
        env.DIGITAL_TWIN_APP_ORIGIN,
        ...parseCommaSeparatedOrigins(env.APP_ORIGINS),
    ].filter(Boolean);
    const allowedOrigins = new Set([
        ...configuredOrigins,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
    ]);
    const app = Fastify({
        logger: {
            level: env.LOG_LEVEL,
            transport: env.NODE_ENV === "development"
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
    app.get("/", async () => {
        return {
            status: "ok",
            service: "backend",
            health: "/health",
            docs: "/docs"
        };
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
    app.register(customerRoutes, { prefix: "/api/customer" });
    app.register(tablesRoutes, { prefix: "/api/tables" });
    app.register(digitalTwinRoutes, { prefix: "/api/digital-twin" });
    app.register(marketingRoutes, { prefix: "/api/marketing" });
    app.register(queueRoutes, { prefix: "/api/queue" });
    return app;
}

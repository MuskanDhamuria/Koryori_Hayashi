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
export function buildApp() {
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
        origin: [env.CUSTOMER_APP_ORIGIN, env.COMPANY_APP_ORIGIN]
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
    return app;
}

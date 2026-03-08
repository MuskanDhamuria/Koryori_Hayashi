import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
export const swaggerPlugin = fp(async (app) => {
    await app.register(swagger, {
        openapi: {
            info: {
                title: "Koryori Hayashi API",
                description: "Backend API for customer ordering and company analytics",
                version: "0.1.0"
            },
            servers: [
                {
                    url: "http://localhost:4000"
                }
            ]
        }
    });
    await app.register(swaggerUi, {
        routePrefix: "/docs"
    });
});

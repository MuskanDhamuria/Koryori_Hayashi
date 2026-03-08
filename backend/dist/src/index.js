import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
const app = buildApp();
const start = async () => {
    try {
        await app.listen({
            port: env.PORT,
            host: env.HOST
        });
        app.log.info(`API listening on http://${env.HOST}:${env.PORT}`);
    }
    catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};
const shutdown = async () => {
    await app.close();
    await prisma.$disconnect();
};
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
void start();

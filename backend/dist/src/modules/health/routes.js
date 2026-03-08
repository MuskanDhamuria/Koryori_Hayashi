import { prisma } from "../../lib/prisma.js";
export const healthRoutes = async (app) => {
    app.get("/", async () => {
        await prisma.$queryRaw `SELECT 1`;
        return {
            status: "ok",
            service: "backend",
            timestamp: new Date().toISOString()
        };
    });
};

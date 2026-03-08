import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
});
export const authRoutes = async (app) => {
    app.post("/staff-login", async (request, reply) => {
        const payload = loginSchema.parse(request.body);
        const user = await prisma.user.findUnique({
            where: { email: payload.email }
        });
        if (!user?.passwordHash) {
            return reply.code(401).send({ message: "Invalid credentials" });
        }
        const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);
        if (!passwordMatches || !["STAFF", "ADMIN"].includes(user.role)) {
            return reply.code(401).send({ message: "Invalid credentials" });
        }
        const token = await reply.jwtSign({
            sub: user.id,
            role: user.role,
            email: user.email ?? undefined
        });
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        };
    });
};

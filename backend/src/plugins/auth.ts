import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";

export const authPlugin = fp(async (app) => {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN
    }
  });

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      void reply.code(401).send({ message: "Authentication required" });
    }
  });

  app.decorate("requireStaff", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      if (!["STAFF", "ADMIN"].includes(request.user.role)) {
        void reply.code(403).send({ message: "Staff access required" });
      }
    } catch {
      void reply.code(401).send({ message: "Authentication required" });
    }
  });
});

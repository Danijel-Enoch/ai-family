import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { cookie } from "@elysiajs/cookie";
import { staticPlugin } from "@elysiajs/static";
import { prisma } from "@ai-family/database";
import { Role, Provider, PROVIDER_CONFIG } from "@ai-family/shared";
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { proxyRoutes } from "./routes/proxy";

const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    })
  )
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key-change-in-production",
      exp: "7d",
    })
  )
  .use(cookie())
  .derive(async ({ cookie }) => {
    const token = cookie?.auth?.value;
    let user = null;
    
    if (token) {
      try {
        const payload = await app.jwt.verify(token);
        user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, email: true, role: true },
        });
      } catch {
        // Invalid token
      }
    }
    
    return { user };
  })
  .derive(async ({ headers }) => {
    const apiKey = headers["x-api-key"];
    let apiKeyData = null;
    
    if (apiKey) {
      apiKeyData = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { 
          user: true,
          providerConfig: true,
        },
      });
    }
    
    return { apiKeyData };
  })
  .get("/", () => ({ status: "ok", message: "AI Family API Proxy" }))
  .use(authRoutes)
  .use(adminRoutes)
  .use(proxyRoutes)
  .listen(3000);

console.log(`🚀 Server running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;

import { Elysia, t } from "elysia";
import { prisma } from "@ai-family/database";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@ai-family.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function ensureAdminExists() {
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: "ADMIN",
      },
    });
    console.log("✅ Admin user created");
  }
}

ensureAdminExists();

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post(
    "/login",
    async ({ body, jwt, cookie }) => {
      const { email, password } = body as { email: string; password: string };

      const user = await prisma.user.findUnique({ where: { email } });
      
      if (!user || user.password !== password) {
        return { success: false, error: "Invalid credentials" };
      }

      const token = await jwt.sign({ sub: user.id, email: user.email, role: user.role });

      cookie.auth.set({
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return {
        success: true,
        user: { id: user.id, email: user.email, role: user.role },
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post("/logout", ({ cookie }) => {
    cookie.auth.delete();
    return { success: true };
  })
  .get("/me", async ({ user }) => {
    if (!user) return { success: false, user: null };
    return { success: true, user };
  });

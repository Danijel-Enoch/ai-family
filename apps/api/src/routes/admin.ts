import { Elysia, t } from "elysia";
import { prisma } from "@ai-family/database";
import { Role, Provider } from "@ai-family/shared";

function generateApiKey(): string {
  return `ak_${crypto.randomUUID().replace(/-/g, "")}`;
}

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .guard({ as: "local" }, (app) =>
    app.onBeforeHandle(async ({ user, error }) => {
      if (!user || user.role !== Role.ADMIN) {
        return error(401, { success: false, error: "Unauthorized" });
      }
    })
  )
  .get("/configs", async () => {
    const configs = await prisma.providerConfig.findMany({
      include: {
        user: { select: { id: true, email: true } },
        _count: { select: { proxyKeys: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, configs };
  })
  .get("/configs/:id", async ({ params: { id } }) => {
    const config = await prisma.providerConfig.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        proxyKeys: true,
      },
    });
    if (!config) return { success: false, error: "Config not found" };
    return { success: true, config: { ...config, apiKey: "***" } };
  })
  .post(
    "/configs",
    async ({ body }) => {
      const { name, provider, apiKey } = body as {
        name: string;
        provider: Provider;
        apiKey: string;
      };

      const user = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
      if (!user) return { success: false, error: "No admin user found" };

      const config = await prisma.providerConfig.create({
        data: { name, provider, apiKey, userId: user.id },
      });

      return { success: true, config: { ...config, apiKey: "***" } };
    },
    {
      body: t.Object({
        name: t.String(),
        provider: t.Union([t.Literal("ANTHROPIC"), t.Literal("OPENAI"), t.Literal("MINIMAX")]),
        apiKey: t.String(),
      }),
    }
  )
  .patch(
    "/configs/:id",
    async ({ params: { id }, body }) => {
      const { name, apiKey, isActive } = body as {
        name?: string;
        apiKey?: string;
        isActive?: boolean;
      };

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (apiKey !== undefined) updateData.apiKey = apiKey;
      if (isActive !== undefined) updateData.isActive = isActive;

      const config = await prisma.providerConfig.update({
        where: { id },
        data: updateData,
      });

      return { success: true, config: { ...config, apiKey: "***" } };
    }
  )
  .delete("/configs/:id", async ({ params: { id } }) => {
    await prisma.providerConfig.delete({ where: { id } });
    return { success: true };
  })
  .get("/keys", async () => {
    const keys = await prisma.apiKey.findMany({
      include: {
        user: { select: { id: true, email: true } },
        providerConfig: { select: { id: true, name: true, provider: true } },
        _count: { select: { usages: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, keys };
  })
  .get("/keys/:id", async ({ params: { id } }) => {
    const key = await prisma.apiKey.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        providerConfig: { select: { id: true, name: true, provider: true } },
      },
    });
    if (!key) return { success: false, error: "API key not found" };
    return { success: true, key };
  })
  .post(
    "/keys",
    async ({ body }) => {
      const { name, provider, providerConfigId: providedConfigId, rateLimit } = body as {
        name: string;
        provider: Provider;
        providerConfigId?: string;
        rateLimit?: number;
      };

      const user = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
      if (!user) return { success: false, error: "No admin user found" };

      let configId = providedConfigId;
      if (!configId) {
        const existingConfig = await prisma.providerConfig.findFirst({
          where: { provider, userId: user.id, isActive: true },
        });
        if (!existingConfig) {
          return { success: false, error: `No active provider config for ${provider}. Create one first.` };
        }
        configId = existingConfig.id;
      }

      const key = await prisma.apiKey.create({
        data: {
          key: generateApiKey(),
          name,
          provider,
          providerConfigId: configId,
          rateLimit: rateLimit || 60,
          userId: user.id,
        },
      });

      return { success: true, key };
    },
    {
      body: t.Object({
        name: t.String(),
        provider: t.Union([t.Literal("ANTHROPIC"), t.Literal("OPENAI"), t.Literal("MINIMAX")]),
        providerConfigId: t.Optional(t.String()),
        rateLimit: t.Optional(t.Number()),
      }),
    }
  )
  .patch(
    "/keys/:id",
    async ({ params: { id }, body }) => {
      const { name, isActive, rateLimit } = body as {
        name?: string;
        isActive?: boolean;
        rateLimit?: number;
      };

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (rateLimit !== undefined) updateData.rateLimit = rateLimit;

      const key = await prisma.apiKey.update({
        where: { id },
        data: updateData,
      });

      return { success: true, key };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        rateLimit: t.Optional(t.Number()),
      }),
    }
  )
  .delete("/keys/:id", async ({ params: { id } }) => {
    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date(), isActive: false },
    });
    return { success: true };
  })
  .post("/keys/:id/revoke", async ({ params: { id } }) => {
    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date(), isActive: false },
    });
    return { success: true };
  })
  .post("/keys/:id/pause", async ({ params: { id } }) => {
    await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  })
  .post("/keys/:id/resume", async ({ params: { id } }) => {
    await prisma.apiKey.update({
      where: { id },
      data: { isActive: true },
    });
    return { success: true };
  })
  .get("/usage", async ({ query }) => {
    const { startDate, endDate, apiKeyId } = query as {
      startDate?: string;
      endDate?: string;
      apiKeyId?: string;
    };

    const where: Record<string, unknown> = {};
    if (apiKeyId) where.apiKeyId = apiKeyId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }

    const usages = await prisma.usageLog.findMany({
      where,
      include: { apiKey: { select: { id: true, name: true, provider: true } } },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const stats = await prisma.usageLog.groupBy({
      by: ["apiKeyId"],
      where,
      _count: { id: true },
      _sum: { tokensUsed: true },
    });

    return { success: true, usages, stats };
  })
  .get("/stats", async () => {
    const totalKeys = await prisma.apiKey.count();
    const activeKeys = await prisma.apiKey.count({ where: { isActive: true } });
    const totalRequests = await prisma.usageLog.count();
    const totalTokens = await prisma.usageLog.aggregate({ _sum: { tokensUsed: true } });

    return {
      success: true,
      stats: {
        totalKeys,
        activeKeys,
        totalRequests,
        totalTokens: totalTokens._sum.tokensUsed || 0,
      },
    };
  });

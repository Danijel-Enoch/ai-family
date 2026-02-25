import { Elysia, t } from "elysia";
import { prisma } from "@ai-family/database";
import { Provider, PROVIDER_CONFIG } from "@ai-family/shared";

async function logUsage(
  apiKeyId: string,
  provider: Provider,
  endpoint: string,
  tokensUsed: number,
  latencyMs: number,
  statusCode: number
) {
  await prisma.usageLog.create({
    data: { apiKeyId, provider, endpoint, tokensUsed, latencyMs, statusCode },
  });
}

async function countTokens(response: unknown, provider: Provider): Promise<number> {
  if (!response || typeof response !== "object") return 0;
  const resp = response as Record<string, unknown>;
  
  if (provider === Provider.OPENAI) {
    const usage = resp.usage as { total_tokens?: number } | undefined;
    return usage?.total_tokens || 0;
  }
  
  if (provider === Provider.ANTHROPIC) {
    const usage = resp.usage_metadata as { input_tokens?: number; output_tokens?: number } | undefined;
    return (usage?.input_tokens || 0) + (usage?.output_tokens || 0);
  }
  
  return 0;
}

function validateApiKey(apiKeyData: unknown) {
  const key = apiKeyData as { isActive?: boolean; revokedAt?: Date | null; providerConfig?: { apiKey?: string; isActive?: boolean } } | null;
  if (!key) return "Invalid API key";
  if (!key.isActive) return "API key is inactive";
  if (key.revokedAt) return "API key has been revoked";
  if (!key.providerConfig?.apiKey) return "Provider config not found";
  if (!key.providerConfig.isActive) return "Provider config is inactive";
  return null;
}

export const proxyRoutes = new Elysia({ prefix: "/proxy" })
  .post(
    "/openai/chat",
    async ({ apiKeyData, body, error }) => {
      const validationError = validateApiKey(apiKeyData);
      if (validationError) {
        return error(401, { success: false, error: validationError });
      }

      const startTime = Date.now();
      const config = PROVIDER_CONFIG[Provider.OPENAI];
      const providerKey = (apiKeyData as { providerConfig: { apiKey: string } }).providerConfig.apiKey;

      try {
        const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            [config.authHeader]: `${config.authPrefix} ${providerKey}`,
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        const latencyMs = Date.now() - startTime;
        const tokens = await countTokens(data, Provider.OPENAI);

        await logUsage((apiKeyData as { id: string }).id, Provider.OPENAI, "/v1/chat/completions", tokens, latencyMs, response.status);

        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return error(502, { success: false, error: "Failed to proxy request" });
      }
    }
  )
  .post(
    "/anthropic/messages",
    async ({ apiKeyData, headers, body, error }) => {
      const validationError = validateApiKey(apiKeyData);
      if (validationError) {
        return error(401, { success: false, error: validationError });
      }

      const startTime = Date.now();
      const config = PROVIDER_CONFIG[Provider.ANTHROPIC];
      const anthropicVersion = headers["anthropic-version"] || "2023-06-01";
      const providerKey = (apiKeyData as { providerConfig: { apiKey: string } }).providerConfig.apiKey;

      try {
        const response = await fetch(`${config.baseUrl}/v1/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            [config.authHeader]: providerKey,
            "anthropic-version": anthropicVersion,
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();
        const latencyMs = Date.now() - startTime;
        const tokens = await countTokens(data, Provider.ANTHROPIC);

        await logUsage((apiKeyData as { id: string }).id, Provider.ANTHROPIC, "/v1/messages", tokens, latencyMs, response.status);

        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return error(502, { success: false, error: "Failed to proxy request" });
      }
    }
  )
  .post(
    "/minimax/chat",
    async ({ apiKeyData, body, error }) => {
      const validationError = validateApiKey(apiKeyData);
      if (validationError) {
        return error(401, { success: false, error: validationError });
      }

      const startTime = Date.now();
      const config = PROVIDER_CONFIG[Provider.MINIMAX];
      const providerKey = (apiKeyData as { providerConfig: { apiKey: string } }).providerConfig.apiKey;
      const reqBody = body as { model?: string };

      const bodyWithModel = {
        ...reqBody,
        model: reqBody.model || "abab6.5s-chat",
      };

      try {
        const response = await fetch(`${config.baseUrl}/text/chatcompletion_v2`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            [config.authHeader]: `${config.authPrefix} ${providerKey}`,
          },
          body: JSON.stringify(bodyWithModel),
        });

        const data = await response.json();
        const latencyMs = Date.now() - startTime;

        await logUsage((apiKeyData as { id: string }).id, Provider.MINIMAX, "/text/chatcompletion_v2", 0, latencyMs, response.status);

        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return error(502, { success: false, error: "Failed to proxy request" });
      }
    }
  );

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum Provider {
  ANTHROPIC = "ANTHROPIC",
  OPENAI = "OPENAI",
  MINIMAX = "MINIMAX",
}

export interface CreateApiKeyInput {
  name: string;
  provider: Provider;
  rateLimit?: number;
  userId?: string;
}

export interface UpdateApiKeyInput {
  name?: string;
  isActive?: boolean;
  rateLimit?: number;
}

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  avgLatencyMs: number;
  requestsByProvider: Record<Provider, number>;
  requestsByDay: { date: string; count: number }[];
}

export interface ProxyConfig {
  provider: Provider;
  baseUrl: string;
  authHeader: string;
  authPrefix?: string;
}

export const PROVIDER_CONFIG: Record<Provider, ProxyConfig> = {
  [Provider.ANTHROPIC]: {
    provider: Provider.ANTHROPIC,
    baseUrl: "https://api.anthropic.com",
    authHeader: "x-api-key",
    authPrefix: "Bearer",
  },
  [Provider.OPENAI]: {
    provider: Provider.OPENAI,
    baseUrl: "https://api.openai.com",
    authHeader: "Authorization",
    authPrefix: "Bearer",
  },
  [Provider.MINIMAX]: {
    provider: Provider.MINIMAX,
    baseUrl: "https://api.minimax.chat/v1",
    authHeader: "Authorization",
    authPrefix: "Bearer",
  },
};

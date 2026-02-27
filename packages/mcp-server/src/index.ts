#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import superjson from "superjson";

const API_URL = process.env.GMACKO_API_URL ?? "http://localhost:3000";
const API_KEY = process.env.GMACKO_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!API_KEY) {
  console.error("Error: GMACKO_API_KEY environment variable is required");
  process.exit(1);
}

interface SuperJSONValue {
  json: unknown;
  meta?: {
    values?: Record<string, string[]>;
    referentialEqualities?: Record<string, string[]>;
  };
}

interface TrpcResponse {
  result?: {
    data: SuperJSONValue;
  };
  error?: {
    message: string;
    code: string;
  };
}

async function callTrpc<T>(path: string, input?: unknown): Promise<T> {
  const url = new URL(`/api/trpc/${path}`, API_URL);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      json: input ?? null,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as TrpcResponse;

  if (data.error) {
    throw new Error(`tRPC Error (${data.error.code}): ${data.error.message}`);
  }

  if (!data.result) {
    throw new Error("Invalid tRPC response: missing result");
  }

  return superjson.deserialize(
    data.result.data as Parameters<typeof superjson.deserialize>[0],
  );
}

// ─── Stripe helpers ──────────────────────────────────────────────────

async function callStripe(
  method: string,
  endpoint: string,
  body?: Record<string, string>,
): Promise<unknown> {
  if (!STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is required for Stripe tools",
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
  };

  let fetchBody: string | undefined;
  if (body && (method === "POST" || method === "PATCH")) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    fetchBody = new URLSearchParams(body).toString();
  }

  const response = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method,
    headers,
    body: fetchBody,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe API error (${response.status}): ${error}`);
  }

  return response.json();
}

// ─── Server Setup ────────────────────────────────────────────────────

const server = new Server(
  {
    name: "create-gmacko-app-mcp",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, () => {
  const tools = [
    // ── App Tools ──
    {
      name: "list_posts",
      description: "List all posts from the application",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [] as string[],
      },
    },
    {
      name: "create_post",
      description: "Create a new post",
      inputSchema: {
        type: "object" as const,
        properties: {
          title: {
            type: "string",
            description: "The post title (max 256 characters)",
          },
          content: {
            type: "string",
            description: "The post content",
          },
        },
        required: ["title", "content"],
      },
    },
    {
      name: "delete_post",
      description: "Delete a post by ID",
      inputSchema: {
        type: "object" as const,
        properties: {
          id: { type: "string", description: "The post ID to delete" },
        },
        required: ["id"],
      },
    },
    {
      name: "get_preferences",
      description: "Get user preferences/settings",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [] as string[],
      },
    },
    {
      name: "update_preferences",
      description: "Update user preferences",
      inputSchema: {
        type: "object" as const,
        properties: {
          theme: {
            type: "string",
            enum: ["light", "dark", "system"],
            description: "UI theme preference",
          },
          language: { type: "string", description: "Language code (e.g. en)" },
          timezone: { type: "string", description: "Timezone (e.g. UTC)" },
          emailNotifications: { type: "boolean" },
          pushNotifications: { type: "boolean" },
        },
        required: [] as string[],
      },
    },
    {
      name: "get_subscription",
      description: "Get the current user subscription plan and status",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [] as string[],
      },
    },
    {
      name: "list_plans",
      description: "List available subscription plans with pricing and features",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [] as string[],
      },
    },

    // ── Stripe Tools (requires STRIPE_SECRET_KEY) ──
    {
      name: "stripe_list_customers",
      description:
        "List Stripe customers. Requires STRIPE_SECRET_KEY env var.",
      inputSchema: {
        type: "object" as const,
        properties: {
          limit: {
            type: "string",
            description: "Number of customers to return (max 100, default 10)",
          },
          email: {
            type: "string",
            description: "Filter by email address",
          },
        },
        required: [] as string[],
      },
    },
    {
      name: "stripe_get_customer",
      description: "Get a Stripe customer by ID",
      inputSchema: {
        type: "object" as const,
        properties: {
          customer_id: { type: "string", description: "Stripe customer ID (cus_...)" },
        },
        required: ["customer_id"],
      },
    },
    {
      name: "stripe_list_subscriptions",
      description: "List Stripe subscriptions, optionally filtered by customer",
      inputSchema: {
        type: "object" as const,
        properties: {
          customer: { type: "string", description: "Filter by customer ID" },
          status: {
            type: "string",
            description: "Filter by status (active, canceled, past_due, trialing)",
          },
          limit: { type: "string", description: "Max results (default 10)" },
        },
        required: [] as string[],
      },
    },
    {
      name: "stripe_get_subscription",
      description: "Get a Stripe subscription by ID",
      inputSchema: {
        type: "object" as const,
        properties: {
          subscription_id: {
            type: "string",
            description: "Stripe subscription ID (sub_...)",
          },
        },
        required: ["subscription_id"],
      },
    },
    {
      name: "stripe_list_products",
      description: "List Stripe products",
      inputSchema: {
        type: "object" as const,
        properties: {
          active: { type: "string", description: "Filter by active (true/false)" },
          limit: { type: "string", description: "Max results (default 10)" },
        },
        required: [] as string[],
      },
    },
    {
      name: "stripe_list_prices",
      description: "List Stripe prices, optionally filtered by product",
      inputSchema: {
        type: "object" as const,
        properties: {
          product: { type: "string", description: "Filter by product ID" },
          active: { type: "string", description: "Filter by active (true/false)" },
          limit: { type: "string", description: "Max results (default 10)" },
        },
        required: [] as string[],
      },
    },
    {
      name: "stripe_list_invoices",
      description: "List Stripe invoices for a customer",
      inputSchema: {
        type: "object" as const,
        properties: {
          customer: { type: "string", description: "Customer ID" },
          status: {
            type: "string",
            description: "Filter by status (draft, open, paid, void, uncollectible)",
          },
          limit: { type: "string", description: "Max results (default 10)" },
        },
        required: [] as string[],
      },
    },
    {
      name: "stripe_get_balance",
      description: "Get the current Stripe account balance",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [] as string[],
      },
    },
  ];

  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ── App Tools ──

      case "list_posts": {
        const posts = await callTrpc<unknown[]>("post.all");
        return {
          content: [{ type: "text", text: JSON.stringify(posts, null, 2) }],
        };
      }

      case "create_post": {
        const { title, content } = args as { title: string; content: string };
        const result = await callTrpc<unknown>("post.create", {
          title,
          content,
        });
        return {
          content: [
            {
              type: "text",
              text: `Post created: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      case "delete_post": {
        await callTrpc<unknown>("post.delete", (args as { id: string }).id);
        return {
          content: [{ type: "text", text: "Post deleted successfully" }],
        };
      }

      case "get_preferences": {
        const prefs = await callTrpc<unknown>("settings.getPreferences");
        return {
          content: [{ type: "text", text: JSON.stringify(prefs, null, 2) }],
        };
      }

      case "update_preferences": {
        const result = await callTrpc<unknown>(
          "settings.updatePreferences",
          args,
        );
        return {
          content: [
            {
              type: "text",
              text: `Preferences updated: ${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      case "get_subscription": {
        const sub = await callTrpc<unknown>("subscription.current");
        return {
          content: [{ type: "text", text: JSON.stringify(sub, null, 2) }],
        };
      }

      case "list_plans": {
        const plans = await callTrpc<unknown>("subscription.plans");
        return {
          content: [{ type: "text", text: JSON.stringify(plans, null, 2) }],
        };
      }

      // ── Stripe Tools ──

      case "stripe_list_customers": {
        const params: Record<string, string> = {};
        const a = args as Record<string, string> | undefined;
        if (a?.limit) params.limit = a.limit;
        if (a?.email) params.email = a.email;
        const qs = new URLSearchParams(params).toString();
        const result = await callStripe(
          "GET",
          `/customers${qs ? `?${qs}` : ""}`,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "stripe_get_customer": {
        const { customer_id } = args as { customer_id: string };
        const result = await callStripe("GET", `/customers/${customer_id}`);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "stripe_list_subscriptions": {
        const params: Record<string, string> = {};
        const a = args as Record<string, string> | undefined;
        if (a?.customer) params.customer = a.customer;
        if (a?.status) params.status = a.status;
        if (a?.limit) params.limit = a.limit;
        const qs = new URLSearchParams(params).toString();
        const result = await callStripe(
          "GET",
          `/subscriptions${qs ? `?${qs}` : ""}`,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "stripe_get_subscription": {
        const { subscription_id } = args as { subscription_id: string };
        const result = await callStripe(
          "GET",
          `/subscriptions/${subscription_id}`,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "stripe_list_products": {
        const params: Record<string, string> = {};
        const a = args as Record<string, string> | undefined;
        if (a?.active) params.active = a.active;
        if (a?.limit) params.limit = a.limit;
        const qs = new URLSearchParams(params).toString();
        const result = await callStripe(
          "GET",
          `/products${qs ? `?${qs}` : ""}`,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "stripe_list_prices": {
        const params: Record<string, string> = {};
        const a = args as Record<string, string> | undefined;
        if (a?.product) params.product = a.product;
        if (a?.active) params.active = a.active;
        if (a?.limit) params.limit = a.limit;
        const qs = new URLSearchParams(params).toString();
        const result = await callStripe(
          "GET",
          `/prices${qs ? `?${qs}` : ""}`,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "stripe_list_invoices": {
        const params: Record<string, string> = {};
        const a = args as Record<string, string> | undefined;
        if (a?.customer) params.customer = a.customer;
        if (a?.status) params.status = a.status;
        if (a?.limit) params.limit = a.limit;
        const qs = new URLSearchParams(params).toString();
        const result = await callStripe(
          "GET",
          `/invoices${qs ? `?${qs}` : ""}`,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "stripe_get_balance": {
        const result = await callStripe("GET", "/balance");
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("create-gmacko-app MCP Server running on stdio");
  if (STRIPE_SECRET_KEY) {
    console.error("  Stripe tools: enabled");
  } else {
    console.error(
      "  Stripe tools: disabled (set STRIPE_SECRET_KEY to enable)",
    );
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

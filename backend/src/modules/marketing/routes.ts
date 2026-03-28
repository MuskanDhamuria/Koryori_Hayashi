import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";

type Campaign = {
  id: string;
  title: string;
  subject: string;
  tags: string[];
  messageText: string;
  messageHtml: string;
  posterPath?: string;
  posterUrl?: string;
};

const campaignSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subject: z.string().min(1),
  tags: z.array(z.string()).default([]),
  messageText: z.string().min(1),
  messageHtml: z.string().min(1),
  posterPath: z.string().min(1).optional(),
  posterUrl: z.string().url().optional(),
});

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function campaignMatchesUser(campaignTags: string[], userTags: Set<string>) {
  const normalizedCampaignTags = campaignTags.map(normalizeTag).filter(Boolean);
  if (normalizedCampaignTags.length === 0) {
    return true;
  }

  for (const tag of normalizedCampaignTags) {
    const normalized =
      tag.includes(":")
        ? tag
        : userTags.has(`category:${tag}`)
          ? `category:${tag}`
          : `weather:${tag}`;

    if (userTags.has(normalized)) {
      return true;
    }
  }

  return false;
}

function contentRootPath() {
  return path.resolve(process.cwd(), env.MARKETING_CONTENT_PATH);
}

function campaignsDir() {
  return path.join(contentRootPath(), "campaigns");
}

function assetsDir() {
  return path.join(contentRootPath(), "assets");
}

async function loadCampaigns(): Promise<Campaign[]> {
  const dir = campaignsDir();
  let entries: string[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }

  const campaigns: Campaign[] = [];
  for (const filename of entries) {
    if (!filename.toLowerCase().endsWith(".json")) continue;
    const fullPath = path.join(dir, filename);
    const raw = await fs.readFile(fullPath, "utf8");
    const parsed = campaignSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      continue;
    }
    campaigns.push(parsed.data);
  }

  return campaigns.sort((a, b) => a.id.localeCompare(b.id));
}

function contentTypeForPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".pdf") return "application/pdf";
  return "application/octet-stream";
}

function safeResolveUnder(root: string, relativePath: string) {
  const resolved = path.resolve(root, relativePath);
  const normalizedRoot = path.resolve(root) + path.sep;
  if (!resolved.startsWith(normalizedRoot)) {
    throw new Error("Invalid path");
  }
  return resolved;
}

function buildUserTags(input: {
  items: Array<{
    menuItemId: string;
    categorySlug: string;
    weatherTags: string[];
  }>;
}) {
  const tags = new Set<string>();
  for (const item of input.items) {
    tags.add(`item:${normalizeTag(item.menuItemId)}`);
    tags.add(`category:${normalizeTag(item.categorySlug)}`);
    for (const weatherTag of item.weatherTags ?? []) {
      tags.add(`weather:${normalizeTag(weatherTag)}`);
    }
  }
  return tags;
}

function requireEmailJsConfigured() {
  const missing: string[] = [];
  if (!env.EMAILJS_SERVICE_ID) missing.push("EMAILJS_SERVICE_ID");
  if (!env.EMAILJS_TEMPLATE_ID) missing.push("EMAILJS_TEMPLATE_ID");
  if (!env.EMAILJS_PUBLIC_KEY) missing.push("EMAILJS_PUBLIC_KEY");
  if (!env.EMAILJS_PRIVATE_KEY) missing.push("EMAILJS_PRIVATE_KEY");

  if (missing.length > 0) {
    throw new Error(`EmailJS is not configured. Missing: ${missing.join(", ")}`);
  }
}

async function sendEmailViaEmailJs(params: {
  toEmail: string;
  toName: string;
  subject: string;
  messageText: string;
  messageHtml: string;
  campaign: Campaign;
  posterUrl?: string;
}) {
  requireEmailJsConfigured();

  const templateParams = {
    to_email: params.toEmail,
    to_name: params.toName,
    subject: params.subject,
    message_text: params.messageText,
    message_html: params.messageHtml,
    campaign_id: params.campaign.id,
    campaign_title: params.campaign.title,
    campaign_tags: params.campaign.tags.join(", "),
    poster_url: params.posterUrl ?? "",
  };

  const response = await fetch(env.EMAILJS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost",
    },
    body: JSON.stringify({
      service_id: env.EMAILJS_SERVICE_ID,
      template_id: env.EMAILJS_TEMPLATE_ID,
      user_id: env.EMAILJS_PUBLIC_KEY,
      accessToken: env.EMAILJS_PRIVATE_KEY,
      template_params: templateParams,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `EmailJS request failed with ${response.status}`);
  }
}

function applySimpleTemplate(input: string, replacements: Record<string, string>) {
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => replacements[key] ?? "");
}

export const marketingRoutes: FastifyPluginAsync = async (app) => {
  app.get("/campaigns", async () => {
    const campaigns = await loadCampaigns();
    return {
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        subject: campaign.subject,
        tags: campaign.tags,
        posterPath: campaign.posterPath ?? null,
        posterUrl: campaign.posterUrl ?? null,
      })),
    };
  });

  app.get("/assets/*", async (request, reply) => {
    const wildcard = (request.params as { "*": string })["*"] ?? "";
    const root = assetsDir();
    const assetPath = safeResolveUnder(root, wildcard);
    const buffer = await fs.readFile(assetPath);
    void reply.header("Content-Type", contentTypeForPath(assetPath));
    return reply.send(buffer);
  });

  app.post("/campaigns/:id/send", async (request) => {
    const { id } = request.params as { id: string };
    const payload = z
      .object({
        dryRun: z.boolean().default(false),
        lookbackDays: z.number().int().positive().max(365).default(90),
        limit: z.number().int().positive().max(1000).default(200),
      })
      .parse(request.body ?? {});

    const campaigns = await loadCampaigns();
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) {
      return { sent: 0, matched: 0, message: "Campaign not found" };
    }

    const since = new Date(Date.now() - payload.lookbackDays * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        email: { not: null },
        orders: {
          some: {
            orderedAt: { gte: since },
          },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        orders: {
          where: { orderedAt: { gte: since } },
          select: {
            orderItems: {
              select: {
                menuItem: {
                  select: {
                    id: true,
                    weatherTags: true,
                    category: {
                      select: { slug: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      take: payload.limit * 3,
    });

    const posterUrl =
      campaign.posterUrl ??
      (campaign.posterPath
        ? `${env.HOST === "0.0.0.0" ? "http://localhost" : `http://${env.HOST}`}:${env.PORT}/api/marketing/${campaign.posterPath.replace(/^assets\//, "assets/")}`
        : undefined);

    const matchedUsers = users.filter((user) => {
      const items = user.orders.flatMap((order) =>
        order.orderItems.map((orderItem) => ({
          menuItemId: orderItem.menuItem.id,
          categorySlug: orderItem.menuItem.category.slug,
          weatherTags: orderItem.menuItem.weatherTags ?? [],
        })),
      );
      const userTags = buildUserTags({ items });
      return campaignMatchesUser(campaign.tags, userTags);
    });

    const selected = matchedUsers.slice(0, payload.limit);

    if (payload.dryRun) {
      return {
        matched: matchedUsers.length,
        selected: selected.length,
        dryRun: true,
        recipients: selected.map((user) => ({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        })),
      };
    }

    let sent = 0;
    const errors: Array<{ email: string; message: string }> = [];

    for (const user of selected) {
      const toEmail = user.email as string;
      const toName = user.fullName;
      const messageText = applySimpleTemplate(campaign.messageText, {
        name: toName,
        posterUrl: posterUrl ?? "",
      });
      const messageHtml = applySimpleTemplate(campaign.messageHtml, {
        name: toName,
        posterUrl: posterUrl ?? "",
      });

      try {
        await sendEmailViaEmailJs({
          toEmail,
          toName,
          subject: campaign.subject,
          messageText,
          messageHtml,
          campaign,
          posterUrl,
        });
        sent += 1;
      } catch (error) {
        errors.push({
          email: toEmail,
          message: error instanceof Error ? error.message : "Failed to send",
        });
      }
    }

    return {
      matched: matchedUsers.length,
      attempted: selected.length,
      sent,
      errors,
    };
  });
};

// ============================================
// HERTZ Platform — Bot Service Entry Point
// ============================================

import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

loadEnv({ path: resolve(process.cwd(), '.env') });

import express from 'express';
import { randomBytes } from 'crypto';
import { Bot, webhookCallback } from 'grammy';
import { S3Client } from '@aws-sdk/client-s3';
import { CommandRegistry } from './commands/registry';
import { createApiRouter, CommandStats } from './routes/api';
import {
  MiddlewarePipeline,
  createAuthMiddleware,
  createAutoRegisterMiddleware,
  createLoggingMiddleware,
  createRateLimiterMiddleware,
} from './middleware/index';
import type { BotContext, TelegramMessage } from './middleware/types';
import { HashtagHandler } from './handlers/hashtagHandler';
import { PublishHandler } from './handlers/publishHandler';
import { HelpHandler } from './handlers/helpHandler';
import { queryOne, execute } from '../../shared/db/query';
import { withTransaction } from '../../shared/db/transaction';
import { ActivityLogService } from '../../shared/services/activityLog';
import { MediaService, createTelegramApiClient } from './services/mediaService';
import { formatBotErrorMessage, logBotError } from './utils/errorHandler';
import type { User, ArticleCategory } from '../../shared/types/index';
import type { HertzPostCategory } from '../../shared/types/feed';
import type { DbClient } from '../../shared/db/query';

// ---- Configuration ----

const PORT = Number(process.env.BOT_PORT) || 4000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const GROUP_CHAT_ID = Number(process.env.TELEGRAM_GROUP_ID) || 0;
const SHORT_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

// ---- Bot Instance ----

/**
 * Create the grammy Bot instance.
 *
 * When no token is provided (e.g. during tests or local dev without Telegram),
 * the bot is created with a placeholder token. Webhook processing will still
 * work structurally, but Telegram API calls will fail gracefully.
 */
const bot = new Bot(BOT_TOKEN || 'placeholder:token');

// ---- Command Registry & Stats ----

const commandRegistry = new CommandRegistry();
const commandStats = new CommandStats();

// ---- Services ----

const activityLogService = new ActivityLogService();

async function createShortId(client: DbClient): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const bytes = randomBytes(8);
    const suffix = Array.from(bytes, (byte) => SHORT_ID_ALPHABET[byte % SHORT_ID_ALPHABET.length]).join('');
    const shortId = `hz_${suffix}`;
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM hertz_posts WHERE short_id = $1',
      [shortId],
      client,
    );
    if (!existing) return shortId;
  }
  throw new Error('Failed to generate HERTZ short id');
}

// ---- Media Service (Cloudflare R2) ----

const r2Endpoint = process.env.R2_ENDPOINT || '';
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const r2BucketName = process.env.R2_BUCKET_NAME || '';
const r2PublicUrl = process.env.R2_PUBLIC_URL || '';

let mediaService: MediaService | null = null;

if (r2Endpoint && r2AccessKeyId && r2SecretAccessKey && r2BucketName && r2PublicUrl) {
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });

  const telegramApiClient = BOT_TOKEN ? createTelegramApiClient(BOT_TOKEN) : null;

  if (telegramApiClient) {
    mediaService = new MediaService(s3Client, telegramApiClient, {
      bucketName: r2BucketName,
      publicUrl: r2PublicUrl,
    });
  }
}

// ---- Shared Database Dependencies for Handlers ----

async function insertArticle(
  data: {
    author_id: string;
    content_html: string;
    title: string | null;
    category: HertzPostCategory;
    source: string;
    status: string;
    slug: string;
    telegram_message_id?: number | null;
    bot_reply_message_id?: number | null;
    telegram_chat_id?: number | null;
  },
  client: DbClient,
): Promise<{ id: string }> {
  const result = await queryOne<{ id: string }>(
    `INSERT INTO articles (author_id, content_html, title, category, source, status, slug,
       telegram_message_id, bot_reply_message_id, telegram_chat_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [data.author_id, data.content_html, data.title, toArticleCategory(data.category), data.source, data.status, data.slug,
     data.telegram_message_id ?? null, data.bot_reply_message_id ?? null, data.telegram_chat_id ?? null],
    client,
  );
  if (!result) {
    throw new Error('Failed to insert article');
  }

  await execute(
    `INSERT INTO hertz_posts (
       short_id, article_id, author_id, type, source, category, status, content,
       telegram_message_id, telegram_chat_id
     )
     VALUES ($1, $2, $3, 'original', $4, $5, $6, $7, $8, $9)
     ON CONFLICT DO NOTHING`,
    [
      await createShortId(client),
      result.id,
      data.author_id,
      data.status === 'published' ? 'admin' : 'telegram',
      data.category,
      data.status === 'published' ? 'published' : 'pending_review',
      data.content_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      data.telegram_message_id ?? null,
      data.telegram_chat_id ?? null,
    ],
    client,
  );

  return result;
}

function toArticleCategory(category: HertzPostCategory): ArticleCategory {
  if (category === 'trading_room') return 'trading';
  if (category === 'life_coffee') return 'life_story';
  return 'general';
}

async function insertMedia(
  data: {
    article_id: string;
    file_url: string;
    media_type: string;
    file_key: string | null;
    file_size: number | null;
  },
  client: DbClient,
): Promise<void> {
  const media = await queryOne<{ id: string }>(
    `INSERT INTO media (article_id, file_url, media_type, file_key, file_size)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [data.article_id, data.file_url, data.media_type, data.file_key, data.file_size],
    client,
  );
  if (!media) return;
  await execute(
    `INSERT INTO hertz_post_media (post_id, media_id, file_url, media_type, file_key, file_size, sort_order)
     SELECT hp.id, $2, $3, $4, $5, $6,
            COALESCE((SELECT MAX(sort_order) + 1 FROM hertz_post_media WHERE post_id = hp.id), 0)
     FROM hertz_posts hp
     WHERE hp.article_id = $1`,
    [data.article_id, media.id, data.file_url, data.media_type, data.file_key, data.file_size],
    client,
  );
}

async function findArticleByMessageId(telegramMessageId: number) {
  return queryOne<{
    id: string; author_id: string; category: ArticleCategory; status: string;
    telegram_message_id: number | null; bot_reply_message_id: number | null;
    telegram_chat_id: number | null;
  }>(
    `SELECT id, author_id, category, status, telegram_message_id, bot_reply_message_id, telegram_chat_id
     FROM articles WHERE telegram_message_id = $1`,
    [telegramMessageId],
  );
}

async function updateArticleStatus(articleId: string, status: string, client: DbClient) {
  await execute('UPDATE articles SET status = $1 WHERE id = $2', [status, articleId], client);
  await execute(
    `UPDATE hertz_posts
     SET status = CASE WHEN $1 = 'published' THEN 'published' ELSE status END,
         published_at = CASE WHEN $1 = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END,
         updated_at = NOW()
     WHERE article_id = $2`,
    [status, articleId],
    client,
  );
}

async function updateArticleReplyMessageId(articleId: string, botReplyMessageId: number) {
  await execute(
    'UPDATE articles SET bot_reply_message_id = $1 WHERE id = $2',
    [botReplyMessageId, articleId],
  );
}

async function getCreditReward(
  category: string,
  client: DbClient,
): Promise<{ credit_reward: number; is_active: boolean } | null> {
  return queryOne<{ credit_reward: number; is_active: boolean }>(
    'SELECT credit_reward, is_active FROM credit_settings WHERE category = $1',
    [category],
    client,
  );
}

async function insertCreditTransaction(
  data: {
    user_id: string;
    amount: number;
    transaction_type: string;
    source_type: string;
    source_id: string;
    description: string | null;
  },
  client: DbClient,
): Promise<void> {
  await execute(
    `INSERT INTO credit_transactions (user_id, amount, transaction_type, source_type, source_id, description)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [data.user_id, data.amount, data.transaction_type, data.source_type, data.source_id, data.description],
    client,
  );
}

async function updateCreditBalance(
  userId: string,
  amount: number,
  client: DbClient,
): Promise<void> {
  await execute(
    'UPDATE users SET credit_balance = credit_balance + $1 WHERE id = $2',
    [amount, userId],
    client,
  );
}

async function findUserByTelegramId(telegramId: number): Promise<User | null> {
  return queryOne<User>(
    'SELECT * FROM users WHERE telegram_id = $1',
    [telegramId],
  );
}

async function createUser(data: { telegram_id: number; username: string | null; role: 'member' }): Promise<User> {
  const result = await queryOne<User>(
    `INSERT INTO users (telegram_id, username, role, credit_balance)
     VALUES ($1, $2, $3, 0)
     RETURNING *`,
    [data.telegram_id, data.username, data.role],
  );
  if (!result) {
    throw new Error('Failed to create user');
  }
  return result;
}

// ---- Handler Dependencies ----

const sharedHandlerDeps = {
  withTransaction,
  insertArticle,
  getCreditReward,
  insertCreditTransaction,
  updateCreditBalance,
  updateArticleReplyMessageId,
};

const mediaHandlerDeps = {
  ...sharedHandlerDeps,
  insertMedia,
  uploadMedia: mediaService
    ? (fileId: string, mediaType: 'image' | 'video') => mediaService!.uploadMedia(fileId, mediaType)
    : undefined,
};

// ---- Register Command Handlers ----

const hashtagHandler = new HashtagHandler(mediaHandlerDeps);
const publishHandler = new PublishHandler({
  findArticleByMessageId,
  withTransaction,
  updateArticleStatus,
  getCreditReward,
  insertCreditTransaction,
  updateCreditBalance,
});
const helpHandler = new HelpHandler(() => commandRegistry.listCommands());

// Register hashtag triggers — each recognized hashtag maps to the same handler logic.
// We create lightweight wrappers that delegate to the shared HashtagHandler instance.
function createHashtagAlias(name: string): import('./commands/types').CommandHandler {
  return {
    name,
    description: hashtagHandler.description,
    permission: hashtagHandler.permission,
    type: 'hashtag' as const,
    execute: (ctx) => hashtagHandler.execute(ctx),
  };
}

commandRegistry.register(createHashtagAlias('#trading'));
commandRegistry.register(createHashtagAlias('#cerita'));
commandRegistry.register(createHashtagAlias('#general'));

// Register slash commands
commandRegistry.register(publishHandler);
commandRegistry.register(helpHandler);

console.log(`[Bot] Registered ${commandRegistry.listCommands().length} command/hashtag handlers`);

// ---- Middleware Pipeline ----

/**
 * Build the middleware pipeline once at startup.
 * The pipeline is stateless per-request (each execute() call gets its own index),
 * so a single instance can safely handle concurrent requests.
 */
const pipeline = new MiddlewarePipeline();

// 1. Auth: validate sender is member of Hertz group
pipeline.use(createAuthMiddleware({
  groupChatId: GROUP_CHAT_ID,
  checkMembership: async (chatId, userId) => {
    if (!BOT_TOKEN || !chatId) return true; // Skip in dev/test
    try {
      const member = await bot.api.getChatMember(chatId, userId);
      return ['member', 'administrator', 'creator'].includes(member.status);
    } catch {
      // If we can't check membership (e.g., bot not in group), allow through
      return true;
    }
  },
}));

// 2. Auto-register: upsert user record
pipeline.use(createAutoRegisterMiddleware({
  findUserByTelegramId,
  createUser,
}));

// 3. Rate limiter: prevent spam
pipeline.use(createRateLimiterMiddleware({
  maxRequests: 10,
  windowMs: 60_000,
}));

// 4. Logging: log all incoming messages
pipeline.use(createLoggingMiddleware({
  log: (entry) => activityLogService.log(entry),
}));

// 5. Command dispatch: resolve and execute the matching handler
pipeline.use(async (botContext, next) => {
  const handler = commandRegistry.resolve(botContext.message);
  if (handler) {
    commandStats.increment(handler.name);
    try {
      await handler.execute(botContext);
    } catch (error) {
      const userMessage = formatBotErrorMessage(error);
      await botContext.reply(userMessage);
      await logBotError(error, {
        action: `command:${handler.name}`,
        userId: botContext.user?.id ?? null,
        telegramUserId: botContext.message?.from?.id ?? null,
        chatId: botContext.message?.chat?.id ?? null,
        messageId: botContext.message?.message_id ?? null,
      }, activityLogService);
    }
  }
  await next();
});

// ---- grammy Error Handler ----

/**
 * Catch all errors from grammy middleware/handlers.
 * Without this, grammy swallows errors silently in webhook mode.
 */
bot.catch((err) => {
  console.error('[Bot] grammy error:', err.error);
  console.error('[Bot] Update that caused error:', JSON.stringify(err.ctx?.update, null, 2));
});

// ---- grammy Message Handler ----

/**
 * Process incoming Telegram messages through the middleware pipeline
 * and dispatch to the appropriate command handler.
 *
 * This is the critical wiring that connects grammy webhook updates
 * to the custom middleware pipeline and command registry.
 */
bot.on('message', async (ctx) => {
  console.log(`[Bot] Received message from ${ctx.message.from?.username ?? ctx.message.from?.id}: ${ctx.message.text?.substring(0, 50) ?? '(no text)'}`);
  const message = ctx.message as unknown as TelegramMessage;

  // Build BotContext for the middleware pipeline
  const botCtx: BotContext = {
    message,
    user: null as unknown as User, // Populated by auto-register middleware
    reply: async (text: string) => {
      try {
        await ctx.reply(text);
      } catch (err) {
        console.error('[Bot] Failed to send reply:', err);
      }
    },
    replyWithError: async (error) => {
      const userMessage = formatBotErrorMessage(error);
      try {
        await ctx.reply(userMessage);
      } catch (err) {
        console.error('[Bot] Failed to send error reply:', err);
      }
    },
    replyWithMessageId: async (text: string): Promise<number> => {
      const sent = await ctx.reply(text);
      return sent.message_id;
    },
    deleteMessage: async (chatId: number, messageId: number): Promise<void> => {
      try {
        await bot.api.deleteMessage(chatId, messageId);
      } catch (err) {
        console.error(`[Bot] Failed to delete message ${messageId} in chat ${chatId}:`, err);
      }
    },
    sendMessage: async (chatId: number, text: string): Promise<number> => {
      const sent = await bot.api.sendMessage(chatId, text);
      return sent.message_id;
    },
  };

  try {
    await pipeline.execute(botCtx);
  } catch (error) {
    console.error('[Bot] Unhandled error in message processing:', error);
    try {
      const userMessage = formatBotErrorMessage(error);
      await ctx.reply(userMessage);
    } catch {
      // If even the error reply fails, just log it
    }
  }
});

// ---- Express App ----

const app = express();

// Parse JSON bodies for all routes
app.use(express.json());

// ---- Startup Timestamp ----

const startedAt = new Date();

// ---- Health Check Endpoint ----

/**
 * GET /api/bot/status
 *
 * Returns bot health information including uptime and current status.
 * Used by Docker health checks and the admin dashboard.
 *
 * Validates: Requirements 15.4, 13.9
 */
app.get('/api/bot/status', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'running',
      uptime: process.uptime(),
      startedAt: startedAt.toISOString(),
      timestamp: new Date().toISOString(),
      botTokenConfigured: BOT_TOKEN.length > 0,
      registeredCommands: commandRegistry.listCommands().length,
      groupChatId: GROUP_CHAT_ID,
    },
  });
});

// ---- Bot REST API Routes ----

/**
 * Mount the bot REST API router at /api/bot.
 * Provides endpoints for listing commands, usage stats, and sending notifications.
 *
 * Validates: Requirements 15.4, 15.5
 */
const apiRouter = createApiRouter({
  registry: commandRegistry,
  stats: commandStats,
  sendGroupMessage: async (message: string) => {
    if (!BOT_TOKEN || !GROUP_CHAT_ID) {
      throw new Error('Bot token or group chat ID not configured');
    }
    await bot.api.sendMessage(GROUP_CHAT_ID, message);
  },
});

app.use('/api/bot', apiRouter);

// ---- Telegram Webhook Endpoint ----

/**
 * POST /webhook/telegram
 *
 * Receives Telegram updates via webhook. The grammy `webhookCallback`
 * adapter handles parsing the update and dispatching it through the
 * bot's middleware/handler pipeline.
 *
 * Validates: Requirements 15.4, 13.9
 */
if (BOT_TOKEN) {
  app.post('/webhook/telegram', (req, res, next) => {
    console.log('[Bot] Webhook received:', JSON.stringify(req.body).substring(0, 200));
    next();
  }, webhookCallback(bot, 'express'));
} else {
  // Fallback when no token is configured — accept the update but do nothing.
  // This keeps the service startable in dev/test without a real Telegram token.
  app.post('/webhook/telegram', (_req, res) => {
    res.sendStatus(200);
  });
}

// ---- Start Server ----

const shouldStartHttpServer =
  process.env.VITEST !== 'true' &&
  process.env.NODE_ENV !== 'test' &&
  process.env.BOT_SKIP_LISTEN !== 'true';

if (shouldStartHttpServer) {
  app.listen(PORT, () => {
    console.log(`Bot service running on port ${PORT}`);
    console.log(`Bot token configured: ${BOT_TOKEN.length > 0}`);
    console.log(`Group chat ID: ${GROUP_CHAT_ID}`);
    console.log(`Registered handlers: ${commandRegistry.listCommands().map(h => h.name).join(', ')}`);
    console.log(`Media service: ${mediaService ? 'enabled' : 'disabled (R2 not configured)'}`);
  });
}

// ---- Exports ----

export { app, bot, commandRegistry, commandStats };

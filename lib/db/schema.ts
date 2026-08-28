import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  integer,
  boolean,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const clothingCategoryEnum = pgEnum('clothing_category', [
  'TOP',
  'BOTTOM',
  'DRESS',
  'UNKNOWN',
]);

export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'FREE',
  'PRO_MONTHLY',
  'PRO_YEARLY',
  'PREMIUM_MONTHLY',
  'PREMIUM_YEARLY',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'ACTIVE',
  'CANCELED',
  'PAST_DUE',
  'EXPIRED',
  'TRIALING',
]);

export const usageLogReasonEnum = pgEnum('usage_log_reason', [
  'GENERATE',
  'REGENERATE',
  'REFUND_FAILURE',
  'REFUND_ADMIN',
  'CREDIT_PACK',
  'SUBSCRIPTION_RESET',
]);

export const uploadTypeEnum = pgEnum('upload_type', [
  'PERSON',
  'CLOTHING',
]);

export const paymentTypeEnum = pgEnum('payment_type', [
  'SUBSCRIPTION',
  'CREDIT_PACK',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
]);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 100 }),
    image: varchar('image', { length: 500 }),
    hashedPassword: varchar('hashed_password', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex('users_email_unique').on(table.email),
  })
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    plan: subscriptionPlanEnum('plan').notNull().default('FREE'),
    status: subscriptionStatusEnum('status').notNull().default('ACTIVE'),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).unique(),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userUniqueIdx: uniqueIndex('subscriptions_user_id_unique').on(table.userId),
    stripeCustomerIdUniqueIdx: uniqueIndex('subscriptions_stripe_customer_id_unique').on(
      table.stripeCustomerId
    ),
    stripeSubIdUniqueIdx: uniqueIndex('subscriptions_stripe_subscription_id_unique').on(
      table.stripeSubscriptionId
    ),
  })
);

export const usageInfos = pgTable(
  'usage_infos',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    totalCredits: integer('total_credits').notNull().default(5),
    usedCredits: integer('used_credits').notNull().default(0),
    bonusCredits: integer('bonus_credits').notNull().default(0),
    lastResetAt: timestamp('last_reset_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('usage_infos_user_id_idx').on(table.userId),
    userUniqueIdx: uniqueIndex('usage_infos_user_id_unique').on(table.userId),
  })
);

export const historyItems = pgTable(
  'history_items',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    personImageUrl: varchar('person_image_url', { length: 500 }).notNull(),
    clothingImageUrl: varchar('clothing_image_url', { length: 500 }).notNull(),
    resultImageUrl: varchar('result_image_url', { length: 500 }).notNull(),
    category: clothingCategoryEnum('category').notNull(),
    generationMs: integer('generation_ms'),
    outputQuality: varchar('output_quality', { length: 20 }).default('standard'),
    isWatermarked: boolean('is_watermarked').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedAtIdx: index('history_items_user_id_created_at_idx').on(
      table.userId,
      table.createdAt.desc()
    ),
  })
);

export const generationRecords = pgTable(
  'generation_records',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    prompt: text('prompt'),
    negativePrompt: text('negative_prompt'),
    personImageUrl: varchar('person_image_url', { length: 500 }),
    clothingImageUrl: varchar('clothing_image_url', { length: 500 }),
    resultImageUrl: varchar('result_image_url', { length: 500 }),
    category: clothingCategoryEnum('category'),
    outputQuality: varchar('output_quality', { length: 20 }),
    generationMs: integer('generation_ms'),
    status: varchar('status', { length: 20 }).notNull(),
    errorCode: varchar('error_code', { length: 50 }),
    errorMessage: varchar('error_message', { length: 500 }),
    creditsConsumed: integer('credits_consumed').notNull().default(0),
    requestId: varchar('request_id', { length: 100 }),
    seed: integer('seed'),
    size: varchar('size', { length: 20 }),
    watermarked: boolean('watermarked'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedAtIdx: index('generation_records_user_id_created_at_idx').on(
      table.userId,
      table.createdAt.desc()
    ),
    statusIdx: index('generation_records_status_idx').on(table.status),
    requestIdIdx: index('generation_records_request_id_idx').on(table.requestId),
  })
);

export const uploads = pgTable(
  'uploads',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: uploadTypeEnum('type').notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
    filename: varchar('filename', { length: 255 }),
    sizeBytes: integer('size_bytes'),
    category: clothingCategoryEnum('category'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userTypeCreatedAtIdx: index('uploads_user_id_type_created_at_idx').on(
      table.userId,
      table.type,
      table.createdAt.desc()
    ),
  })
);

export const usageLogs = pgTable(
  'usage_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    reason: usageLogReasonEnum('reason').notNull(),
    remainingAfter: integer('remaining_after').notNull(),
    relatedHistoryId: integer('related_history_id').references(() => historyItems.id, {
      onDelete: 'set null',
    }),
    stripeInvoiceId: varchar('stripe_invoice_id', { length: 255 }),
    note: varchar('note', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedAtIdx: index('usage_logs_user_id_created_at_idx').on(
      table.userId,
      table.createdAt.desc()
    ),
    reasonIdx: index('usage_logs_reason_idx').on(table.reason),
  })
);

export const accounts = pgTable(
  'accounts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    provider: varchar('provider', { length: 50 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refreshToken: varchar('refresh_token', { length: 500 }),
    accessToken: varchar('access_token', { length: 500 }),
    expiresAt: integer('expires_at'),
    tokenType: varchar('token_type', { length: 50 }),
    scope: varchar('scope', { length: 255 }),
    idToken: varchar('id_token', { length: 500 }),
    sessionState: varchar('session_state', { length: 255 }),
  },
  (table) => ({
    providerAccountIdUniqueIdx: uniqueIndex(
      'accounts_provider_provider_account_id_unique'
    ).on(table.provider, table.providerAccountId),
    userIdx: index('accounts_user_id_idx').on(table.userId),
  })
);

export const sessions = pgTable(
  'sessions',
  {
    id: serial('id').primaryKey(),
    sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => ({
    sessionTokenUniqueIdx: uniqueIndex('sessions_session_token_unique').on(
      table.sessionToken
    ),
    userIdx: index('sessions_user_id_idx').on(table.userId),
  })
);

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => ({
    identifierTokenUniqueIdx: uniqueIndex(
      'verification_tokens_identifier_token_unique'
    ).on(table.identifier, table.token),
    tokenUniqueIdx: uniqueIndex('verification_tokens_token_unique').on(table.token),
  })
);

export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: paymentTypeEnum('type').notNull(),
    plan: subscriptionPlanEnum('plan'),
    creditsPack: integer('credits_pack'),
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('usd'),
    status: paymentStatusEnum('status').notNull().default('PENDING'),
    creditsGranted: integer('credits_granted').notNull().default(0),
    stripeSessionId: varchar('stripe_session_id', { length: 255 }).unique(),
    stripeInvoiceId: varchar('stripe_invoice_id', { length: 255 }).unique(),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userCreatedAtIdx: index('payments_user_id_created_at_idx').on(
      table.userId,
      table.createdAt.desc()
    ),
    statusIdx: index('payments_status_idx').on(table.status),
  })
);

export const stripeWebhookEvents = pgTable(
  'stripe_webhook_events',
  {
    id: serial('id').primaryKey(),
    eventId: varchar('event_id', { length: 255 }).notNull().unique(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: text('payload').notNull(),
    processed: boolean('processed').notNull().default(false),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    error: varchar('error', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    eventIdUniqueIdx: uniqueIndex('stripe_webhook_events_event_id_unique').on(table.eventId),
    eventTypeIdx: index('stripe_webhook_events_event_type_idx').on(table.eventType),
  })
);

export const guestUsage = pgTable(
  'guest_usage',
  {
    id: serial('id').primaryKey(),
    anonymousId: varchar('anonymous_id', { length: 100 }).notNull(),
    ipHash: varchar('ip_hash', { length: 100 }),
    totalCredits: integer('total_credits').notNull().default(5),
    usedCredits: integer('used_credits').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    anonymousIdUniqueIdx: uniqueIndex('guest_usage_anonymous_id_unique').on(table.anonymousId),
    ipHashIdx: index('guest_usage_ip_hash_idx').on(table.ipHash),
  })
);

export const admins = pgTable(
  'admins',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 100 }),
    hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUniqueIdx: uniqueIndex('admins_email_unique').on(table.email),
  })
);

CREATE
EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "users"
(
  "id"        TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "suiWallet" TEXT         NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_users"
(
  "id"                TEXT         NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  "telegramUsername"  TEXT,
  "telegramFirstName" TEXT         NOT NULL,
  "telegramLastName"  TEXT,
  "isBot"             BOOLEAN      NOT NULL DEFAULT false,

  CONSTRAINT "telegram_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_users"
(
  "id"          TEXT         NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  "username"    TEXT         NOT NULL,
  "displayName" TEXT         NOT NULL,
  "isBot"       BOOLEAN      NOT NULL DEFAULT false,

  CONSTRAINT "discord_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents"
(
  "id"                  TEXT         NOT NULL,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  "credits"             INTEGER      NOT NULL DEFAULT 0,
  "creditsUsed"         INTEGER      NOT NULL DEFAULT 0,
  "name"                TEXT         NOT NULL,
  "description"         TEXT         NOT NULL,
  "personality"         TEXT         NOT NULL,
  "instruction"         TEXT         NOT NULL,
  "knowledge"           TEXT,
  "botToken"            TEXT,
  "botId"               TEXT,
  "botFirstName"        TEXT,
  "botUsername"         TEXT,
  "botAvatar"           TEXT,
  "tgGroupLink"         TEXT,
  "tgGroupTitle"        TEXT,
  "tgGroupId"           TEXT,
  "apiSecret"           TEXT,
  "contextCount"        INTEGER      NOT NULL DEFAULT 10,
  "cloudProvider"       TEXT,
  "twitterRefreshToken" TEXT,
  "twitterAccessToken"  TEXT,
  "twitterUsername"     TEXT,
  "twitterUserId"       TEXT,
  "discordToken"        TEXT,
  "discordId"           TEXT,
  "discordUsername"     TEXT,
  "discordDisplayName"  TEXT,
  "discordAvatar"       TEXT,
  "discordGroupLink"    TEXT,
  "userId"              TEXT         NOT NULL,

  CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_attachments"
(
  "id"          SERIAL       NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  "link"        TEXT         NOT NULL,
  "title"       TEXT         NOT NULL,
  "description" TEXT         NOT NULL,
  "content"     TEXT         NOT NULL,
  "agentId"     TEXT         NOT NULL,

  CONSTRAINT "agent_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tools"
(
  "id"              SERIAL       NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "name"            TEXT         NOT NULL,
  "description"     TEXT         NOT NULL,
  "expireInSeconds" INTEGER      NOT NULL,
  "enabled"         BOOLEAN      NOT NULL DEFAULT false,
  "url"             TEXT         NOT NULL,
  "method"          TEXT         NOT NULL,
  "headers"         TEXT,
  "parameters"      TEXT,
  "requestBody"     TEXT,
  "responsePath"    TEXT,

  CONSTRAINT "agent_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tool_logs"
(
  "id"         BIGSERIAL    NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "toolCallId" TEXT         NOT NULL,
  "input"      TEXT         NOT NULL,
  "output"     TEXT,
  "error"      TEXT,
  "agentId"    TEXT,
  "toolId"     INTEGER      NOT NULL,

  CONSTRAINT "agent_tool_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_plugins"
(
  "id"          SERIAL       NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name"        TEXT         NOT NULL,
  "description" TEXT,
  "hook"        INTEGER      NOT NULL,
  "enabled"     BOOLEAN      NOT NULL DEFAULT false,
  "agentId"     TEXT         NOT NULL,

  CONSTRAINT "agent_plugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages"
(
  "id"             TEXT         NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "groupId"        TEXT         NOT NULL,
  "threadId"       TEXT,
  "messageId"      TEXT,
  "text"           TEXT         NOT NULL,
  "imageUrl"       TEXT,
  "telegramUserId" TEXT,
  "discordUserId"  TEXT,
  "quoteMessageId" TEXT,

  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_summaries"
(
  "groupId"       TEXT         NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  "summary"       TEXT         NOT NULL,
  "knowledge"     TEXT         NOT NULL,
  "profile"       TEXT         NOT NULL,
  "lastMessageId" TEXT         NOT NULL,

  CONSTRAINT "message_summaries_pkey" PRIMARY KEY ("groupId")
);

-- CreateTable
CREATE TABLE "inference_logs"
(
  "id"           BIGSERIAL    NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "system"       TEXT         NOT NULL,
  "input"        TEXT         NOT NULL,
  "output"       TEXT         NOT NULL,
  "stopReason"   TEXT         NOT NULL,
  "inputTokens"  INTEGER      NOT NULL DEFAULT 0,
  "outputTokens" INTEGER      NOT NULL DEFAULT 0,
  "modelId"      TEXT         NOT NULL DEFAULT '',
  "scenario"     TEXT         NOT NULL DEFAULT '',
  "isFailed"     BOOLEAN,
  "agentId"      TEXT,

  CONSTRAINT "inference_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twitter_posts"
(
  "id"           TEXT         NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "text"         TEXT         NOT NULL,
  "tweetId"      TEXT,
  "quoteTweetId" TEXT,
  "replyTweetId" TEXT,
  "status"       INTEGER      NOT NULL DEFAULT 1,
  "inChat"       BOOLEAN      NOT NULL DEFAULT false,
  "agentId"      TEXT,

  CONSTRAINT "twitter_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twitter_users"
(
  "id"              TEXT         NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  "name"            TEXT,
  "username"        TEXT,
  "location"        TEXT,
  "description"     TEXT,
  "profileImageUrl" TEXT,

  CONSTRAINT "twitter_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embeddings"
(
  "id"                TEXT         NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "content"           TEXT         NOT NULL,
  "embedding"         vector(1536) NOT NULL,
  "agentId"           TEXT         NOT NULL,
  "agentAttachmentId" INTEGER      NOT NULL,

  CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AgentToAgentTool"
(
  "A" TEXT    NOT NULL,
  "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_suiWallet_key" ON "users" ("suiWallet");

-- CreateIndex
CREATE UNIQUE INDEX "agents_botToken_key" ON "agents" ("botToken");

-- CreateIndex
CREATE UNIQUE INDEX "agents_botId_key" ON "agents" ("botId");

-- CreateIndex
CREATE UNIQUE INDEX "agents_botUsername_key" ON "agents" ("botUsername");

-- CreateIndex
CREATE UNIQUE INDEX "agents_apiSecret_key" ON "agents" ("apiSecret");

-- CreateIndex
CREATE UNIQUE INDEX "agents_discordToken_key" ON "agents" ("discordToken");

-- CreateIndex
CREATE UNIQUE INDEX "agents_discordId_key" ON "agents" ("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_tools_name_key" ON "agent_tools" ("name");

-- CreateIndex
CREATE UNIQUE INDEX "agent_tool_logs_toolCallId_key" ON "agent_tool_logs" ("toolCallId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_plugins_name_key" ON "agent_plugins" ("name");

-- CreateIndex
CREATE INDEX "messages_groupId_threadId_idx" ON "messages" ("groupId", "threadId");

-- CreateIndex
CREATE UNIQUE INDEX "twitter_posts_tweetId_key" ON "twitter_posts" ("tweetId");

-- CreateIndex
CREATE UNIQUE INDEX "twitter_posts_agentId_replyTweetId_key" ON "twitter_posts" ("agentId", "replyTweetId");

-- CreateIndex
CREATE UNIQUE INDEX "twitter_posts_agentId_quoteTweetId_key" ON "twitter_posts" ("agentId", "quoteTweetId");

-- CreateIndex
CREATE UNIQUE INDEX "_AgentToAgentTool_AB_unique" ON "_AgentToAgentTool" ("A", "B");

-- CreateIndex
CREATE INDEX "_AgentToAgentTool_B_index" ON "_AgentToAgentTool" ("B");

-- AddForeignKey
ALTER TABLE "agents"
  ADD CONSTRAINT "agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_attachments"
  ADD CONSTRAINT "agent_attachments_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tool_logs"
  ADD CONSTRAINT "agent_tool_logs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_tool_logs"
  ADD CONSTRAINT "agent_tool_logs_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "agent_tools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_plugins"
  ADD CONSTRAINT "agent_plugins_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages"
  ADD CONSTRAINT "messages_telegramUserId_fkey" FOREIGN KEY ("telegramUserId") REFERENCES "telegram_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages"
  ADD CONSTRAINT "messages_discordUserId_fkey" FOREIGN KEY ("discordUserId") REFERENCES "discord_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages"
  ADD CONSTRAINT "messages_quoteMessageId_fkey" FOREIGN KEY ("quoteMessageId") REFERENCES "messages" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inference_logs"
  ADD CONSTRAINT "inference_logs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twitter_posts"
  ADD CONSTRAINT "twitter_posts_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embeddings"
  ADD CONSTRAINT "embeddings_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embeddings"
  ADD CONSTRAINT "embeddings_agentAttachmentId_fkey" FOREIGN KEY ("agentAttachmentId") REFERENCES "agent_attachments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgentToAgentTool"
  ADD CONSTRAINT "_AgentToAgentTool_A_fkey" FOREIGN KEY ("A") REFERENCES "agents" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgentToAgentTool"
  ADD CONSTRAINT "_AgentToAgentTool_B_fkey" FOREIGN KEY ("B") REFERENCES "agent_tools" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

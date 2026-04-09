import type { User } from "@prisma/client";
import type { Credentials } from "google-auth-library";
import type { gmail_v1 } from "googleapis";

import { getEnv } from "@/lib/env";
import { getGmailApi, refreshGoogleAccessToken } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/security";

const MESSAGE_HEADERS = ["Subject", "From", "Date"] as const;
const RETRY_ATTEMPTS = 3;

type SyncUserRecord = Pick<
  User,
  | "id"
  | "email"
  | "syncEnabled"
  | "encryptedAccessToken"
  | "encryptedRefreshToken"
  | "accessTokenExpiresAt"
  | "gmailHistoryId"
>;

export type SyncRunSummary = {
  processedUsers: number;
  syncedEmails: number;
  skippedEmails: number;
  failedUsers: Array<{ email: string; error: string }>;
};

export async function syncAllMailboxes(): Promise<SyncRunSummary> {
  const env = getEnv();
  const users = await prisma.user.findMany({
    where: {
      syncEnabled: true,
    },
    select: {
      id: true,
      email: true,
      syncEnabled: true,
      encryptedAccessToken: true,
      encryptedRefreshToken: true,
      accessTokenExpiresAt: true,
      gmailHistoryId: true,
    },
    orderBy: {
      email: "asc",
    },
  });

  const summary: SyncRunSummary = {
    processedUsers: users.length,
    syncedEmails: 0,
    skippedEmails: 0,
    failedUsers: [],
  };

  for (const user of users) {
    try {
      const result = await runMailboxSync(user);
      summary.syncedEmails += result.syncedEmails;
      summary.skippedEmails += result.skippedEmails;
    } catch (error) {
      summary.failedUsers.push({
        email: user.email,
        error: getErrorMessage(error),
      });
    }

    if (env.GMAIL_SYNC_DELAY_MS > 0) {
      await delay(env.GMAIL_SYNC_DELAY_MS);
    }
  }

  return summary;
}

export async function syncMailboxByUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      syncEnabled: true,
      encryptedAccessToken: true,
      encryptedRefreshToken: true,
      accessTokenExpiresAt: true,
      gmailHistoryId: true,
    },
  });

  if (!user) {
    throw new Error("Connected account not found.");
  }

  return runMailboxSync(user);
}

async function runMailboxSync(user: SyncUserRecord) {
  if (!user.syncEnabled) {
    throw new Error("Sync is disabled for this account.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastSyncAttemptAt: new Date() },
  });

  try {
    return await syncSingleMailbox(user);
  } catch (error) {
    const message = getErrorMessage(error);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSyncError: message, lastSyncAttemptAt: new Date() },
    });

    throw error;
  }
}

async function syncSingleMailbox(user: SyncUserRecord) {
  let accessToken = decryptSecret(user.encryptedAccessToken);
  let refreshToken = user.encryptedRefreshToken
    ? decryptSecret(user.encryptedRefreshToken)
    : null;
  let accessTokenExpiresAt = user.accessTokenExpiresAt;

  if (shouldRefreshToken(accessTokenExpiresAt)) {
    if (!refreshToken) {
      throw new Error("Refresh token missing for this user.");
    }

    const refreshed = await refreshGoogleAccessToken(refreshToken);
    if (!refreshed.access_token) {
      throw new Error("Google did not return a refreshed access token.");
    }

    accessToken = refreshed.access_token;
    refreshToken = refreshed.refresh_token ?? refreshToken;
    accessTokenExpiresAt = refreshed.expiry_date
      ? new Date(refreshed.expiry_date)
      : new Date(Date.now() + 55 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        encryptedAccessToken: encryptSecret(accessToken),
        encryptedRefreshToken: refreshToken ? encryptSecret(refreshToken) : null,
        accessTokenExpiresAt,
      },
    });
  }

  const credentials: Credentials = {
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
    expiry_date: accessTokenExpiresAt?.getTime(),
  };
  const gmail = getGmailApi(credentials);
  const storedEmailCount = await prisma.syncedEmail.count({
    where: {
      userId: user.id,
    },
  });
  const candidateIds = await getCandidateMessageIds(
    gmail,
    user.gmailHistoryId,
    storedEmailCount === 0,
  );
  const uniqueIds = [...new Set(candidateIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    const currentHistoryId = await getLatestHistoryId(gmail);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        gmailHistoryId: currentHistoryId,
        lastEmailSyncAt: new Date(),
        lastSyncAttemptAt: new Date(),
        lastSyncError: null,
      },
    });

    return {
      syncedEmails: 0,
      skippedEmails: 0,
    };
  }

  const existingMessages = await prisma.syncedEmail.findMany({
    where: {
      userId: user.id,
      gmailMessageId: {
        in: uniqueIds,
      },
    },
    select: {
      gmailMessageId: true,
    },
  });
  const existingIds = new Set(existingMessages.map((message) => message.gmailMessageId));

  let syncedEmails = 0;
  let skippedEmails = 0;

  for (const messageId of uniqueIds) {
    if (existingIds.has(messageId)) {
      skippedEmails += 1;
      continue;
    }

    const message = await withRetry(() =>
      gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "metadata",
        metadataHeaders: [...MESSAGE_HEADERS],
      }),
    );

    const mapped = mapMessage(message.data);

    if (!mapped) {
      skippedEmails += 1;
      continue;
    }

    try {
      await prisma.syncedEmail.create({
        data: {
          userId: user.id,
          mailboxEmail: user.email,
          gmailMessageId: messageId,
          gmailThreadId: message.data.threadId ?? messageId,
          subject: mapped.subject,
          sender: mapped.sender,
          snippet: message.data.snippet ?? "",
          receivedAt: mapped.receivedAt,
        },
      });
      syncedEmails += 1;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        skippedEmails += 1;
        continue;
      }

      throw error;
    }
  }

  const currentHistoryId = await getLatestHistoryId(gmail);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      gmailHistoryId: currentHistoryId,
      lastEmailSyncAt: new Date(),
      lastSyncAttemptAt: new Date(),
      lastSyncError: null,
    },
  });

  return {
    syncedEmails,
    skippedEmails,
  };
}

async function getCandidateMessageIds(
  gmail: gmail_v1.Gmail,
  historyId: string | null,
  shouldBackfillRecentInbox: boolean,
) {
  if (shouldBackfillRecentInbox) {
    return listRecentInboxMessageIds(gmail);
  }

  if (historyId) {
    try {
      return await listMessageIdsFromHistory(gmail, historyId);
    } catch (error) {
      if (!isRecoverableHistoryError(error)) {
        throw error;
      }
    }
  }

  return listRecentInboxMessageIds(gmail);
}

async function listMessageIdsFromHistory(
  gmail: gmail_v1.Gmail,
  historyId: string,
) {
  const env = getEnv();
  const ids = new Set<string>();
  let pageToken: string | undefined;

  do {
    const response = await withRetry(() =>
      gmail.users.history.list({
        userId: "me",
        startHistoryId: historyId,
        historyTypes: ["messageAdded"],
        maxResults: env.GMAIL_SYNC_BATCH_SIZE,
        labelId: "INBOX",
        pageToken,
      }),
    );

    for (const history of response.data.history ?? []) {
      for (const item of history.messagesAdded ?? []) {
        const id = item.message?.id;
        if (id) {
          ids.add(id);
        }
      }
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken && ids.size < env.GMAIL_SYNC_BATCH_SIZE);

  return [...ids].slice(0, env.GMAIL_SYNC_BATCH_SIZE);
}

async function listRecentInboxMessageIds(gmail: gmail_v1.Gmail) {
  const response = await withRetry(() =>
    gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      includeSpamTrash: false,
      maxResults: getEnv().GMAIL_SYNC_BATCH_SIZE,
    }),
  );

  return (response.data.messages ?? [])
    .map((message) => message.id)
    .filter((id): id is string => Boolean(id));
}

async function getLatestHistoryId(gmail: gmail_v1.Gmail) {
  const response = await withRetry(() =>
    gmail.users.getProfile({
      userId: "me",
    }),
  );

  return response.data.historyId ?? null;
}

function mapMessage(message: gmail_v1.Schema$Message) {
  const headers = message.payload?.headers ?? [];
  const subject = findHeader(headers, "Subject") ?? "(No subject)";
  const sender = findHeader(headers, "From") ?? "Unknown sender";
  const receivedAt = message.internalDate
    ? new Date(Number(message.internalDate))
    : new Date();

  return {
    subject,
    sender,
    receivedAt,
  };
}

function findHeader(
  headers: gmail_v1.Schema$MessagePartHeader[],
  name: string,
) {
  return (
    headers.find(
      (header) => header.name?.toLowerCase() === name.toLowerCase(),
    )?.value ?? null
  );
}

function shouldRefreshToken(accessTokenExpiresAt: Date | null) {
  if (!accessTokenExpiresAt) {
    return true;
  }

  return accessTokenExpiresAt.getTime() <= Date.now() + 60_000;
}

function isRecoverableHistoryError(error: unknown) {
  const status = getStatusCode(error);
  const message = getErrorMessage(error).toLowerCase();

  return (
    status === 404 ||
    status === 410 ||
    message.includes("starthistoryid") ||
    message.includes("historyid")
  );
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function getStatusCode(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }

  if (
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "status" in error.response &&
    typeof error.response.status === "number"
  ) {
    return error.response.status;
  }

  return undefined;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown sync error.";
}

async function withRetry<T>(fn: () => Promise<T>, attempts = RETRY_ATTEMPTS) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        await delay(350 * attempt);
      }
    }
  }

  throw lastError;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

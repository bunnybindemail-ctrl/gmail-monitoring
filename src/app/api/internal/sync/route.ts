import { NextRequest, NextResponse } from "next/server";

import { getEnv } from "@/lib/env";
import { syncAllMailboxes } from "@/lib/gmail-sync";

export async function POST(request: NextRequest) {
  const incomingSecret = request.headers.get("x-cron-secret");

  if (incomingSecret !== getEnv().CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncAllMailboxes();
  return NextResponse.json(result);
}

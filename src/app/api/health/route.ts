import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "gmail-monitoring",
    timestamp: new Date().toISOString(),
  });
}

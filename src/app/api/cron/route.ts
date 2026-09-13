import { NextResponse } from "next/server";
import { loadFixtures } from "@/lib/fixture-store";

export const dynamic = "force-dynamic";

async function handle() {
  try {
    const entry = await loadFixtures(true);
    return NextResponse.json({
      ok: true,
      fixtures: entry.data.length,
      source: entry.source,
      refreshedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  if (process.env.VERCEL && request.headers.get("x-vercel-cron") !== "1") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return handle();
}

export async function POST(request: Request) {
  if (process.env.VERCEL && request.headers.get("x-vercel-cron") !== "1") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return handle();
}
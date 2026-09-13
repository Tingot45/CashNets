import { NextResponse } from "next/server";
import { hasGeminiKey } from "@/lib/sentiment";
import { hasApiFootballKey } from "@/lib/api-football";
import { hasOddsKey } from "@/lib/odds-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    apiFootballConfigured: hasApiFootballKey(),
    oddsConfigured: hasOddsKey(),
    geminiConfigured: hasGeminiKey(),
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  });
}
import { NextResponse } from "next/server";
import { fetchLatestModels } from "../../../lib/huggingface";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const catalog = await fetchLatestModels(async (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(7000) }));
    return NextResponse.json(catalog, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Hugging Face 모델 목록을 불러오지 못했습니다." }, { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}

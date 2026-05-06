import { NextResponse } from "next/server";

import { routeLogger } from "@/shared/infra/logger/with-context.server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    routeLogger.warn("CSP_VIOLATION", {
      report: body,
    });

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      {
        error: "INVALID_CSP_REPORT",
      },
      { status: 400 },
    );
  }
}

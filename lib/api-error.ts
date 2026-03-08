/**
 * Consistent API error responses. Log details server-side; return generic message to client.
 */

import { NextResponse } from "next/server";

export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

/** Return 500 JSON with generic message. Log `detail` server-side (e.g. error.message). */
export function genericServerError(logContext: string, detail: unknown): NextResponse {
  console.error(`[${logContext}]`, detail);
  return NextResponse.json({ error: GENERIC_ERROR_MESSAGE }, { status: 500 });
}

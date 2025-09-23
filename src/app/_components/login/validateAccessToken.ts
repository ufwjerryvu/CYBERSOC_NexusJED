import "server-only";

import { cookies } from "next/headers";
import { db } from "~/server/db";

export type TokenValidationResult =
  | { ok: true; email: string }
  | { ok: false; code: "MISSING" | "INVALID" | "NOT_FOUND" | "SERVER_ERROR" };


export async function validateAccessToken(): Promise<TokenValidationResult> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("access_token")?.value;
    if (!raw) return { ok: false, code: "MISSING" } as const;

    let email: string;
    try {
      email = decodeURIComponent(raw);
    } catch {
      return { ok: false, code: "INVALID" } as const;
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return { ok: false, code: "NOT_FOUND" } as const;

    return { ok: true, email } as const;
  } catch {
    return { ok: false, code: "SERVER_ERROR" } as const;
  }
}

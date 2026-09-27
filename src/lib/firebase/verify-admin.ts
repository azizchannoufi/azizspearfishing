import { NextRequest } from "next/server";
import { getAdminAuth } from "./admin";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function verifyAdminRequest(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new AuthError("Your session has expired. Please log in again.");
  }
  const token = header.slice(7);
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    if (decoded.admin !== true) {
      throw new AuthError("Access denied.", 403);
    }
    return decoded;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError("Your session has expired. Please log in again.");
  }
}

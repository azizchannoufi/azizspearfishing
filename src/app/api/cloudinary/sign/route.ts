import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, AuthError } from "@/lib/firebase/verify-admin";
import { createUploadSignature } from "@/lib/cloudinary/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  folder: z.string().min(1).max(120).default("aziz"),
});

export async function POST(request: NextRequest) {
  try {
    await verifyAdminRequest(request);
    const json = await request.json().catch(() => ({}));
    const { folder } = bodySchema.parse(json);
    const safeFolder = folder.startsWith("aziz/") ? folder : `aziz/${folder}`;
    const signed = createUploadSignature(safeFolder);
    return NextResponse.json(signed);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Image upload failed." }, { status: 500 });
  }
}

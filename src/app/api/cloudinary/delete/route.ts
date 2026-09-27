import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, AuthError } from "@/lib/firebase/verify-admin";
import { destroyCloudinaryAsset } from "@/lib/cloudinary/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  publicId: z.string().min(1),
  resourceType: z.enum(["image", "video"]).default("image"),
});

export async function POST(request: NextRequest) {
  try {
    await verifyAdminRequest(request);
    const json = await request.json();
    const { publicId, resourceType } = bodySchema.parse(json);
    await destroyCloudinaryAsset(publicId, resourceType);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unable to delete media." }, { status: 500 });
  }
}

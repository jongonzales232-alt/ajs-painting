import fs from "fs/promises";
import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/admin-request";
import { getPrivateUploadPath } from "../../../../../lib/upload";

const contentTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const authError = await requireAdmin(_request);
  if (authError) return authError;

  try {
    const { filename } = await params;
    const filePath = getPrivateUploadPath("lead-photos", filename);
    const file = await fs.readFile(filePath);
    const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentTypes[extension] || "application/octet-stream",
        "Cache-Control": "private, max-age=300"
      }
    });
  } catch {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }
}

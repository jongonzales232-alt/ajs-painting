import { NextResponse } from "next/server";
import fs from "fs/promises";
import { requireAdmin } from "../../../../lib/admin-request";
import { prisma } from "../../../../lib/prisma";
import { getPublicUploadPath, saveUpload } from "../../../../lib/upload";

export const runtime = "nodejs";

const allowedKeys = new Set(["contactBusinessImage"]);

export async function PATCH(request) {
  const authError = await requireAdmin(request, { mutation: true });
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const key = String(formData.get("key") || "");
    if (!allowedKeys.has(key)) {
      return NextResponse.json({ error: "Unknown site image." }, { status: 400 });
    }

    const file = formData.get("photo");
    const upload = await saveUpload(file, "site");
    if (!upload) return NextResponse.json({ error: "Please choose a photo." }, { status: 400 });

    const existing = await prisma.siteAsset.findUnique({ where: { key } });
    const asset = await prisma.siteAsset.upsert({
      where: { key },
      update: {
        ...upload,
        alt: String(formData.get("alt") || "").trim()
      },
      create: {
        key,
        ...upload,
        alt: String(formData.get("alt") || "").trim()
      }
    });

    if (existing?.filename) {
      try {
        await fs.unlink(getPublicUploadPath("site", existing.filename));
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Old site image cleanup failed.", { key, filename: existing.filename, error: error.message });
        }
      }
    }

    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Site image update failed." }, { status: 400 });
  }
}

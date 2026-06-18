import { NextResponse } from "next/server";
import fs from "fs/promises";
import { requireAdmin } from "../../../../lib/admin-request";
import { prisma } from "../../../../lib/prisma";
import { getPublicUploadPath, saveUpload } from "../../../../lib/upload";

export const runtime = "nodejs";

export async function POST(request) {
  const authError = await requireAdmin(request, { mutation: true });
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const upload = await saveUpload(formData.get("photo"), "gallery");
    if (!upload) return NextResponse.json({ error: "Please choose a photo." }, { status: 400 });

    const photo = await prisma.galleryPhoto.create({
      data: {
        ...upload,
        title: String(formData.get("title") || "").trim() || null,
        description: String(formData.get("description") || "").trim() || null,
        jobType: String(formData.get("jobType") || "").trim() || null,
        jobDate: formData.get("jobDate") ? new Date(String(formData.get("jobDate"))) : null
      }
    });

    return NextResponse.json({ photo });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Photo upload failed." }, { status: 400 });
  }
}

export async function PATCH(request) {
  const authError = await requireAdmin(request, { mutation: true });
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const id = String(formData.get("id") || "");
    if (!id) return NextResponse.json({ error: "Missing photo id." }, { status: 400 });

    const existing = await prisma.galleryPhoto.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

    const file = formData.get("photo");
    const replacement = file && file.size > 0 ? await saveUpload(file, "gallery") : null;

    const photo = await prisma.galleryPhoto.update({
      where: { id },
      data: {
        ...(replacement || {}),
        title: String(formData.get("title") || "").trim() || null,
        description: String(formData.get("description") || "").trim() || null,
        jobType: String(formData.get("jobType") || "").trim() || null,
        jobDate: formData.get("jobDate") ? new Date(String(formData.get("jobDate"))) : null
      }
    });

    if (replacement && existing.filename) {
      try {
        await fs.unlink(getPublicUploadPath("gallery", existing.filename));
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Old gallery file cleanup failed.", { id, filename: existing.filename, error: error.message });
        }
      }
    }

    return NextResponse.json({ photo });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Photo update failed." }, { status: 400 });
  }
}

export async function DELETE(request) {
  const authError = await requireAdmin(request, { mutation: true });
  if (authError) return authError;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing photo id." }, { status: 400 });

  try {
    const photo = await prisma.galleryPhoto.delete({ where: { id } });
    try {
      await fs.unlink(getPublicUploadPath("gallery", photo.filename));
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error("Gallery file cleanup failed.", { id, filename: photo.filename, error: error.message });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not delete photo." }, { status: 500 });
  }
}

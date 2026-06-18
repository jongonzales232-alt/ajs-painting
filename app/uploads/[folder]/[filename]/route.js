import fs from "fs/promises";
import { NextResponse } from "next/server";
import { getPublicUploadPath } from "../../../../lib/upload";

const contentTypes = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

export async function GET(_request, { params }) {
  const { folder, filename } = await params;
  const filePath = getPublicUploadPath(folder, filename);
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();

  if (!contentTypes[ext]) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 404 });
  }

  try {
    const bytes = await fs.readFile(filePath);
    return new NextResponse(bytes, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentTypes[ext]
      }
    });
  } catch {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }
}

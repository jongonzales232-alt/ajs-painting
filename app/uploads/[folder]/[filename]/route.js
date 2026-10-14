import { publicImageResponse } from "../../../../lib/public-image-response.mjs";

export const runtime = "nodejs";
export async function GET(request, { params }) {
  return publicImageResponse(request, await params);
}
export const HEAD = GET;

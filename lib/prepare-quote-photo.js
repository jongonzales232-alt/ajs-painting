import { MAX_ORIGINAL_PHOTO_BYTES, MAX_QUOTE_PHOTO_BYTES } from "./quote-photos";

export async function prepareQuotePhoto(file) {
  if (file.size > MAX_ORIGINAL_PHOTO_BYTES) throw new Error(`${file.name}: please choose a photo smaller than 25 MB.`);
  if (!file.size) throw new Error(`${file.name}: this file is empty.`);
  if (/\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/i.test(file.type)) {
    throw new Error(`${file.name}: please export this photo as JPG or choose a JPG screenshot.`);
  }
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type) && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
    throw new Error(`${file.name}: choose a JPG, PNG, WebP, or GIF photo.`);
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error(`${file.name}: this photo could not be opened. Please choose another image.`));
      img.src = url;
    });
    let edge = 2000;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare photos. Please try another browser.");
    // Re-encode to reduce upload/email size and remove location metadata.
    for (let attempt = 0; attempt < 5; attempt++) {
      const scale = Math.min(1, edge / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82 - attempt * 0.07));
      if (blob && blob.size <= MAX_QUOTE_PHOTO_BYTES) {
        const name = (file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 70) || "project-photo") + ".jpg";
        return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
      }
      edge = Math.round(edge * 0.8);
    }
    throw new Error(`${file.name}: this photo could not be made small enough. Please choose a smaller image.`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

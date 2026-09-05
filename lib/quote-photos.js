export const MAX_QUOTE_PHOTOS = 20;
export const MAX_ORIGINAL_PHOTO_BYTES = 25 * 1024 * 1024;
export const MAX_QUOTE_PHOTO_BYTES = 750 * 1024;
export const MAX_QUOTE_TOTAL_BYTES = MAX_QUOTE_PHOTOS * MAX_QUOTE_PHOTO_BYTES;

export function validateQuotePhotos(files) {
  if (files.length > MAX_QUOTE_PHOTOS) throw new Error(`Please choose up to ${MAX_QUOTE_PHOTOS} photos.`);
  for (const file of files) {
    if (!file || typeof file.arrayBuffer !== "function" || !file.size) throw new Error("Please choose valid photo files.");
    if (file.size > MAX_QUOTE_PHOTO_BYTES) throw new Error("A photo is too large to email. Refresh the quote page and select your photos again so they can be resized.");
  }
  if (files.reduce((total, file) => total + file.size, 0) > MAX_QUOTE_TOTAL_BYTES) throw new Error("The photos are too large to email together. Please select fewer photos.");
}

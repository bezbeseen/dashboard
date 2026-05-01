/** Extract a Drive folder id from a pasted URL or raw id. */
export function parseGoogleDriveFolderId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const fromUrl = s.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
  if (fromUrl) return fromUrl[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s)) return s;
  return null;
}

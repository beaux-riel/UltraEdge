/**
 * iOS can relocate an application's sandbox during an update or restore.
 * Only rebase app-owned Documents/gpx files; never reinterpret arbitrary files.
 */
export function resolveLocalGpxUri(storedUri: string, documentUri: string): string {
  const match = /^file:\/\/.*\/Documents\/gpx\/([^/?#]+)$/.exec(storedUri);
  if (!match) return storedUri;
  // Reject encoded traversal/separators before joining an untrusted saved name.
  let filename: string;
  try { filename = decodeURIComponent(match[1]); } catch { return storedUri; }
  if (filename === '.' || filename === '..' || /[/\\\0]/.test(filename)) return storedUri;
  return `${documentUri.replace(/\/$/, '')}/gpx/${match[1]}`;
}

import * as FS from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
export interface PlanAttachment {
  path: string;
  name: string;
  mimeType: string;
}
const folder = () => {
  if (!FS.documentDirectory) {
    throw new Error('File storage is unavailable on this device.');
  }
  return FS.documentDirectory + 'plan-attachments/';
};
export function attachmentUri(path: string): string {
  if (!/^[a-zA-Z0-9-]+\.(jpg|png|webp|heic|pdf)$/.test(path)) {
    throw new Error('Invalid attachment path.');
  }
  return folder() + path;
}
export async function saveAttachment(
  uri: string,
  name: string,
  mimeType: string,
): Promise<PlanAttachment> {
  const extension =
    mimeType === 'application/pdf'
      ? 'pdf'
      : mimeType === 'image/png'
        ? 'png'
        : mimeType === 'image/webp'
          ? 'webp'
          : mimeType === 'image/heic'
            ? 'heic'
            : 'jpg';
  const info = await FS.getInfoAsync(uri);
  if (
    !info.exists ||
    !('size' in info) ||
    info.size <= 0 ||
    info.size > 50 * 1024 * 1024
  ) {
    throw new Error('Choose a non-empty file smaller than 50 MB.');
  }
  if (extension === 'pdf') {
    const header = await FS.readAsStringAsync(uri, {
      encoding: FS.EncodingType.Base64,
      position: 0,
      length: 5,
    });
    if (header !== 'JVBERi0=') {
      throw new Error('This file is not a PDF.');
    }
  }
  await FS.makeDirectoryAsync(folder(), { intermediates: true });
  const path = `${Crypto.randomUUID()}.${extension}`;
  await FS.copyAsync({ from: uri, to: attachmentUri(path) });
  return { path, name, mimeType };
}

/** Share a readable filename while keeping stored references stable and unique. */
export async function attachmentShareUri(attachment: PlanAttachment): Promise<string> {
  if (!FS.cacheDirectory) throw new Error('File sharing storage is unavailable.');
  const name = attachment.name.replace(/[\\/\x00-\x1f]/g, '_').slice(0, 120).replace(/\.pdf$/i, '') || 'Race guide';
  const directory = `${FS.cacheDirectory}guide-share-${Crypto.randomUUID()}/`;
  await FS.makeDirectoryAsync(directory, { intermediates: true });
  const uri = `${directory}${name}.pdf`;
  await FS.copyAsync({ from: attachmentUri(attachment.path), to: uri });
  return uri;
}

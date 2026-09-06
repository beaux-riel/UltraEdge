import * as FS from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { attachmentPathPattern, retainAttachment, beginAttachmentDeletion, restoreAttachmentAvailability } from './attachmentRetention';
export { retainAttachment } from './attachmentRetention';
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
const imports = new Map<string, () => void>();

export function releaseAttachmentImport(path: string): void {
  imports.get(path)?.();
  imports.delete(path);
}

export async function cleanupAttachments(records: unknown[]): Promise<void> {
  const references = new Set<string>();
  const visit = (value: unknown): void => {
    if (typeof value === 'string') {
      references.add(value);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(visit);
    }
  };
  records.forEach(visit);
  if (!(await FS.getInfoAsync(folder())).exists) return;
  for (const path of await FS.readDirectoryAsync(folder())) {
    if (!attachmentPathPattern.test(path) || references.has(path) || references.has(attachmentUri(path))) continue;
    try {
      if ((await FS.getInfoAsync(attachmentUri(path))).isDirectory || !beginAttachmentDeletion(path)) continue;
      await FS.deleteAsync(attachmentUri(path), { idempotent: true });
    } catch {
      try {
        const info = await FS.getInfoAsync(attachmentUri(path));
        if (info.exists && !info.isDirectory) {
          restoreAttachmentAvailability(path);
        }
      } catch {
        continue;
      }
      continue;
    }
  }
}
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
  imports.set(path, retainAttachment(path));
  try {
    await FS.copyAsync({ from: uri, to: attachmentUri(path) });
  } catch (error) {
    releaseAttachmentImport(path);
    throw error;
  }
  return { path, name, mimeType };
}

/** Share a readable filename while keeping stored references stable and unique. */
export async function attachmentShareUri(attachment: PlanAttachment): Promise<string> {
  const release = retainAttachment(attachment.path);
  try {
    if (!FS.cacheDirectory) throw new Error('File sharing storage is unavailable.');
    const name = attachment.name.replace(/[\\/\x00-\x1f]/g, '_').slice(0, 120).replace(/\.pdf$/i, '') || 'Race guide';
    const directory = `${FS.cacheDirectory}guide-share-${Crypto.randomUUID()}/`;
    await FS.makeDirectoryAsync(directory, { intermediates: true });
    const uri = `${directory}${name}.pdf`;
    await FS.copyAsync({ from: attachmentUri(attachment.path), to: uri });
    return uri;
  } finally {
    release();
  }
}

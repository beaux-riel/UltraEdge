export const attachmentPathPattern = /^[a-zA-Z0-9-]+\.(jpg|png|webp|heic|pdf)$/;
export const retainedAttachments = new Map<string, number>();
export const unavailableAttachments = new Set<string>();
let requestCleanup = () => {};

function relativeAttachmentPath(path: string): string {
  return path.startsWith('file:') && path.includes('/plan-attachments/') ? path.split('/').pop()! : path;
}

export function beginAttachmentDeletion(path: string): boolean {
  if (retainedAttachments.has(path)) {
    return false;
  }
  unavailableAttachments.add(path);
  return true;
}

export function restoreAttachmentAvailability(path: string): void {
  unavailableAttachments.delete(path);
}

export function assertAttachmentRecordsAvailable(records: unknown): void {
  if (typeof records === 'string' && unavailableAttachments.has(relativeAttachmentPath(records))) {
    throw new Error('This attachment is no longer available. Remove it or select it again before saving.');
  }
  if (records && typeof records === 'object') {
    Object.values(records).forEach(assertAttachmentRecordsAvailable);
  }
}

export function registerAttachmentCleanup(callback: () => void): void {
  requestCleanup = callback;
}

export function retainAttachment(path?: string | null): () => void {
  if (!path) {
    return () => {};
  }
  const relative = relativeAttachmentPath(path);
  if (!attachmentPathPattern.test(relative)) {
    return () => {};
  }
  retainedAttachments.set(relative, (retainedAttachments.get(relative) ?? 0) + 1);
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    const count = (retainedAttachments.get(relative) ?? 1) - 1;
    if (count) {
      retainedAttachments.set(relative, count);
    } else {
      retainedAttachments.delete(relative);
    }
    requestCleanup();
  };
}

export function retainAttachmentRecords(records: unknown): () => void {
  const releases: (() => void)[] = [];
  const visit = (value: unknown): void => {
    if (typeof value === 'string') {
      releases.push(retainAttachment(value));
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(visit);
    }
  };
  visit(records);
  return () => releases.forEach(release => release());
}

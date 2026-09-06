jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  cacheDirectory: 'file:///cache/',
  EncodingType: { Base64: 'base64' },
  getInfoAsync: jest.fn(), readDirectoryAsync: jest.fn(), deleteAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(), copyAsync: jest.fn(), readAsStringAsync: jest.fn(),
}));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FS from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { attachmentUri, saveAttachment, releaseAttachmentImport, retainAttachment, attachmentShareUri } from '../attachments';
import { retainedAttachments, unavailableAttachments } from '../attachmentRetention';
import { deleteLocalEvent, deleteLocalGear, runLocalPlanOperation, saveArrayChanges } from '../localPlanStorage';

const files = new Set<string>();
const originalSet = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
const put = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value));
const sweep = () => runLocalPlanOperation(async () => undefined);
const gearKey = '@ultraedge/gear-items';
const eventsKey = '@ultraedge/events';

beforeEach(async () => {
  await sweep();
  jest.clearAllMocks();
  retainedAttachments.clear();
  unavailableAttachments.clear();
  files.clear();
  (AsyncStorage.setItem as jest.Mock).mockImplementation(originalSet);
  await AsyncStorage.clear();
  (FS.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 100 });
  (FS.readDirectoryAsync as jest.Mock).mockImplementation(async () => [...files]);
  (FS.deleteAsync as jest.Mock).mockImplementation(async (uri: string) => { files.delete(uri.split('/').pop()!); });
  (FS.copyAsync as jest.Mock).mockImplementation(async ({ to }: { to: string }) => { files.add(to.split('/').pop()!); });
  (FS.readAsStringAsync as jest.Mock).mockResolvedValue('JVBERi0=');
  (Crypto.randomUUID as jest.Mock).mockReturnValue('imported');
});

test('replacement and removal preserve photos shared across gear, bags and templates', async () => {
  files.add('shared.jpg');
  files.add('replacement.jpg');
  const initial = [{ id: 'gear', imageUrl: 'shared.jpg' }];
  await put(gearKey, initial);
  await put('@ultraedge/dropbags', [{ id: 'bag', imageUrl: attachmentUri('shared.jpg') }]);
  await put('@ultraedge/dropbag-templates', [{ id: 'template', imageUrl: 'shared.jpg' }]);
  const next = [{ id: 'gear', imageUrl: 'replacement.jpg' }];
  await saveArrayChanges(gearKey, initial, next);
  expect(files.has('shared.jpg')).toBe(true);
  await saveArrayChanges('@ultraedge/dropbags', [{ id: 'bag', imageUrl: attachmentUri('shared.jpg') }], []);
  expect(files.has('shared.jpg')).toBe(true);
  await saveArrayChanges('@ultraedge/dropbag-templates', [{ id: 'template', imageUrl: 'shared.jpg' }], []);
  expect(files.has('shared.jpg')).toBe(false);
  await saveArrayChanges<{ id: string; imageUrl?: string }>(gearKey, next, [{ id: 'gear' }]);
  expect(files.size).toBe(0);
});

test('event and gear deletion clean guides and child photos, preserving other references', async () => {
  ['guide.pdf', 'bag.jpg', 'gear.jpg'].forEach(path => files.add(path));
  await put(eventsKey, [{ id: 'race', raceGuide: { path: 'guide.pdf' } }, { id: 'other', raceGuide: { path: 'guide.pdf' } }]);
  await put('@ultraedge/dropbags', [{ id: 'bag', eventId: 'race', imageUrl: 'bag.jpg', items: [] }]);
  await put(gearKey, [{ id: 'gear', imageUrl: 'gear.jpg' }]);
  await deleteLocalEvent('race');
  expect([...files].sort()).toEqual(['gear.jpg', 'guide.pdf']);
  await deleteLocalEvent('other');
  await deleteLocalGear('gear');
  expect(files.size).toBe(0);
});

test('startup removes abandoned imports but never deletes outside managed filenames', async () => {
  ['abandoned.pdf', '../outside.jpg', 'unknown.txt', 'directory'].forEach(path => files.add(path));
  await sweep();
  expect([...files]).toEqual(['../outside.jpg', 'unknown.txt', 'directory']);
});

test('interrupted cascades preserve all files until journal recovery succeeds', async () => {
  files.add('guide.pdf');
  files.add('bag.jpg');
  await put(eventsKey, [{ id: 'race', raceGuide: { path: 'guide.pdf' } }]);
  await put('@ultraedge/dropbags', [{ id: 'bag', eventId: 'race', imageUrl: 'bag.jpg' }]);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key, value) => {
    if (key === eventsKey) throw new Error('Disk full');
    return originalSet(key, value);
  });
  await expect(deleteLocalEvent('race')).rejects.toThrow('Disk full');
  await expect(sweep()).rejects.toThrow('Disk full');
  expect(files.size).toBe(2);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(originalSet);
  await sweep();
  expect(files.size).toBe(0);
  expect(await AsyncStorage.getItem('@ultraedge/pending-plan-write')).toBeNull();
});

test.each(['broken JSON', '{}'])('unreadable reference storage disables cleanup: %s', async raw => {
  files.add('keep.jpg');
  await AsyncStorage.setItem(eventsKey, raw);
  await sweep();
  expect(files.has('keep.jpg')).toBe(true);
});

test('restart recovery commits a journaled replacement before collecting the old guide', async () => {
  files.add('old.pdf');
  files.add('new.pdf');
  await put(eventsKey, [{ id: 'race', raceGuide: { path: 'old.pdf' } }]);
  await put('@ultraedge/pending-plan-write', [[eventsKey, JSON.stringify([{ id: 'race', raceGuide: { path: 'new.pdf' } }])]]);
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Recovery unavailable'));
  await expect(sweep()).rejects.toThrow('Recovery unavailable');
  expect(files.size).toBe(2);
  await sweep();
  expect([...files]).toEqual(['new.pdf']);
  expect(JSON.parse((await AsyncStorage.getItem(eventsKey))!)[0].raceGuide.path).toBe('new.pdf');
});

test('directories are not treated as attachment files even when named like a PDF', async () => {
  files.add('directory.pdf');
  (FS.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, isDirectory: true });
  await sweep();
  expect(FS.deleteAsync).not.toHaveBeenCalled();
});

test('cleanup errors do not fail durable saves, and failed deletions retry', async () => {
  files.add('old.jpg');
  const before = [{ id: 'gear', imageUrl: 'old.jpg' }];
  await put(gearKey, before);
  (FS.deleteAsync as jest.Mock).mockRejectedValueOnce(new Error('Busy file'));
  await expect(saveArrayChanges(gearKey, before, [])).resolves.toEqual([]);
  expect(files.has('old.jpg')).toBe(true);
  await sweep();
  expect(files.has('old.jpg')).toBe(false);
});

test('in-flight copies and unsaved drafts survive unrelated cleanup until released', async () => {
  let finishCopy!: () => void;
  let copying!: () => void;
  const started = new Promise<void>(resolve => { copying = resolve; });
  (FS.copyAsync as jest.Mock).mockImplementationOnce(async () => {
    files.add('imported.jpg');
    copying();
    await new Promise<void>(resolve => { finishCopy = resolve; });
  });
  const saving = saveAttachment('file:///picker/photo', 'Photo', 'image/jpeg');
  await started;
  await sweep();
  expect(files.has('imported.jpg')).toBe(true);
  finishCopy();
  const attachment = await saving;
  const releaseDraft = retainAttachment(attachment.path);
  releaseAttachmentImport(attachment.path);
  await sweep();
  expect(files.has(attachment.path)).toBe(true);
  releaseDraft();
  await sweep();
  expect(files.has(attachment.path)).toBe(false);
});

test('failed saves retain disk references and drafts for retry; abandonment removes only the draft', async () => {
  files.add('old.jpg');
  files.add('draft.jpg');
  const before = [{ id: 'gear', imageUrl: 'old.jpg' }];
  await put(gearKey, before);
  const release = retainAttachment('draft.jpg');
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));
  await expect(saveArrayChanges(gearKey, before, [{ id: 'gear', imageUrl: 'draft.jpg' }])).rejects.toThrow('Disk full');
  await sweep();
  expect(files.size).toBe(2);
  release();
  await sweep();
  expect([...files]).toEqual(['old.jpg']);
});

test('queued saves protect attachments even if the editing screen unmounts first', async () => {
  files.add('queued.jpg');
  const release = retainAttachment('queued.jpg');
  const prior = sweep();
  const saving = saveArrayChanges(gearKey, [], [{ id: 'gear', imageUrl: 'queued.jpg' }]);
  release();
  await prior;
  await saving;
  await sweep();
  expect(files.has('queued.jpg')).toBe(true);
});

test.each([
  [gearKey, { imageUrl: 'race.jpg' }],
  [gearKey, { imageUrl: 'file:///documents/plan-attachments/race.jpg' }],
  [eventsKey, { raceGuide: { path: 'race.jpg' } }],
])('rejects a reference acquired after native deletion starts: %s %j', async (key, attachment) => {
  files.add('race.jpg');
  const before = [{ id: 'old', ...attachment }];
  await put(key, before);
  let finishDeletion!: () => void;
  let deleting!: () => void;
  const started = new Promise<void>(resolve => { deleting = resolve; });
  (FS.deleteAsync as jest.Mock).mockImplementationOnce(async () => {
    deleting();
    await new Promise<void>(resolve => { finishDeletion = resolve; });
    files.delete('race.jpg');
  });
  const removing = saveArrayChanges(key, before, []);
  await started;
  const saving = saveArrayChanges(key, [], [{ id: 'new', ...attachment }]);
  const rejected = expect(saving).rejects.toThrow('attachment is no longer available');
  finishDeletion();
  await removing;
  await rejected;
  expect(files.has('race.jpg')).toBe(false);
  expect(JSON.parse((await AsyncStorage.getItem(key))!)).toEqual([]);
});

test('failed copies release partial files for cleanup', async () => {
  (FS.copyAsync as jest.Mock).mockImplementationOnce(async () => {
    files.add('imported.jpg');
    throw new Error('Copy failed');
  });
  await expect(saveAttachment('file:///picker/photo', 'Photo', 'image/jpeg')).rejects.toThrow('Copy failed');
  await sweep();
  expect(files.size).toBe(0);
});

test.each([true, false])('a failed deletion permits a queued reference only if the file still exists: %s', async stillExists => {
  files.add('failed-delete.jpg');
  let finishDeletion!: () => void;
  let deleting!: () => void;
  const started = new Promise<void>(resolve => { deleting = resolve; });
  (FS.getInfoAsync as jest.Mock).mockImplementation(async (uri: string) => ({
    exists: uri.endsWith('plan-attachments/') || files.has(uri.split('/').pop()!),
    isDirectory: uri.endsWith('plan-attachments/'),
  }));
  (FS.deleteAsync as jest.Mock).mockImplementationOnce(async () => {
    deleting();
    await new Promise<void>(resolve => { finishDeletion = resolve; });
    if (!stillExists) {
      files.delete('failed-delete.jpg');
    }
    throw new Error('Native deletion failed');
  });
  const collecting = sweep();
  await started;
  const next = [{ id: 'new', imageUrl: 'failed-delete.jpg' }];
  const saving = saveArrayChanges(gearKey, [], next);
  const checked = stillExists
    ? expect(saving).resolves.toEqual(next)
    : expect(saving).rejects.toThrow('attachment is no longer available');
  finishDeletion();
  await collecting;
  await checked;
  expect(await AsyncStorage.getItem(gearKey)).toBe(stillExists ? JSON.stringify(next) : null);
});

test('a guide being copied for sharing stays protected after its event is removed', async () => {
  files.add('guide.pdf');
  await put(eventsKey, [{ id: 'race', raceGuide: { path: 'guide.pdf' } }]);
  let finishCopy!: () => void;
  let copying!: () => void;
  const started = new Promise<void>(resolve => { copying = resolve; });
  (FS.copyAsync as jest.Mock).mockImplementationOnce(async () => {
    copying();
    await new Promise<void>(resolve => { finishCopy = resolve; });
  });
  const sharing = attachmentShareUri({ path: 'guide.pdf', name: 'Guide.pdf', mimeType: 'application/pdf' });
  await started;
  await deleteLocalEvent('race');
  expect(files.has('guide.pdf')).toBe(true);
  finishCopy();
  await sharing;
  await sweep();
  expect(files.has('guide.pdf')).toBe(false);
});

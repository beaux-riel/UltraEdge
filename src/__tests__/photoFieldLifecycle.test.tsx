jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///documents/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 100 }),
  makeDirectoryAsync: jest.fn(), copyAsync: jest.fn(),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'photo' }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('../components/ui', () => {
  const { Text, TouchableOpacity } = require('react-native');
  return { BodySmall: Text, Button: TouchableOpacity };
});

import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import * as FS from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import PhotoField from '../components/PhotoField';
import { retainedAttachments, unavailableAttachments, beginAttachmentDeletion } from '../lib/attachmentRetention';
const { act, create } = require('react-test-renderer');

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  retainedAttachments.clear();
  unavailableAttachments.clear();
  (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///picker/photo', mimeType: 'image/jpeg' }] });
  (FS.copyAsync as jest.Mock).mockResolvedValue(undefined);
});

test('a selected draft remains protected until removed or the form is abandoned', async () => {
  function Draft() {
    const [value, setValue] = useState<string | null>('old.jpg');
    return <PhotoField value={value} onChange={setValue} />;
  }
  let tree: any;
  await act(async () => { tree = create(<Draft />); });
  expect(retainedAttachments.has('old.jpg')).toBe(true);
  await act(async () => { await tree.root.findAllByType(TouchableOpacity)[0].props.onPress(); });
  expect(retainedAttachments.has('old.jpg')).toBe(false);
  expect(retainedAttachments.get('photo.jpg')).toBe(1);
  await act(async () => { await tree.root.findAllByType(TouchableOpacity)[1].props.onPress(); });
  expect(retainedAttachments.has('photo.jpg')).toBe(false);
  await act(async () => { await tree.root.findAllByType(TouchableOpacity)[0].props.onPress(); });
  expect(retainedAttachments.has('photo.jpg')).toBe(true);
  await act(async () => { tree.unmount(); });
  expect(retainedAttachments.size).toBe(0);
});

test('failed immediate saves release the import while preserving the old photo', async () => {
  let tree: any;
  await act(async () => { tree = create(<PhotoField value="old.jpg" onChange={async () => { throw new Error('Disk full'); }} />); });
  await act(async () => { await tree.root.findAllByType(TouchableOpacity)[0].props.onPress(); });
  expect(retainedAttachments.has('photo.jpg')).toBe(false);
  expect(retainedAttachments.has('old.jpg')).toBe(true);
  await act(async () => { tree.unmount(); });
});

test('mounting and updating a photo whose deletion has started does not throw from its layout effect', async () => {
  expect(beginAttachmentDeletion('deleting.jpg')).toBe(true);
  let tree: any;
  await act(async () => { tree = create(<PhotoField value="deleting.jpg" />); });
  expect(retainedAttachments.has('deleting.jpg')).toBe(true);
  expect(beginAttachmentDeletion('another.jpg')).toBe(true);
  await act(async () => { tree.update(<PhotoField value="another.jpg" />); });
  expect(retainedAttachments.has('deleting.jpg')).toBe(false);
  expect(retainedAttachments.has('another.jpg')).toBe(true);
  await act(async () => { tree.unmount(); });
  expect(retainedAttachments.size).toBe(0);
});

test('leaving during a copy releases its eventual import without updating the abandoned form', async () => {
  let finishCopy!: () => void;
  let copying!: () => void;
  const started = new Promise<void>(resolve => { copying = resolve; });
  (FS.copyAsync as jest.Mock).mockImplementationOnce(async () => {
    copying();
    await new Promise<void>(resolve => { finishCopy = resolve; });
  });
  const onChange = jest.fn();
  let tree: any;
  let picking!: Promise<void>;
  await act(async () => { tree = create(<PhotoField onChange={onChange} />); });
  await act(async () => {
    picking = tree.root.findAllByType(TouchableOpacity)[0].props.onPress();
    await started;
  });
  expect(retainedAttachments.has('photo.jpg')).toBe(true);
  await act(async () => { tree.unmount(); });
  await act(async () => { finishCopy(); await picking; });
  expect(onChange).not.toHaveBeenCalled();
  expect(retainedAttachments.size).toBe(0);
});

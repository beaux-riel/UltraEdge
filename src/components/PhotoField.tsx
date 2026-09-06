import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BodySmall, Button } from './ui';
import { attachmentUri, saveAttachment, retainAttachment, releaseAttachmentImport } from '../lib/attachments';
export default function PhotoField({
  value,
  onChange,
  disabled = false,
  onBusyChange,
}: {
  value?: string | null;
  onChange?: (v: string | null) => void | Promise<void>;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const lock = useRef(false);
  const imported = useRef(new Set<string>());
  useLayoutEffect(() => {
    const release = retainAttachment(value);
    if (value && imported.current.delete(value)) {
      releaseAttachmentImport(value);
    }
    return release;
  }, [value]);
  useEffect(() => {
    mounted.current = true;
    const pendingImports = imported.current;
    return () => {
      mounted.current = false;
      pendingImports.forEach(releaseAttachmentImport);
      pendingImports.clear();
    };
  }, []);
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
  const pick = async () => {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setBusy(true);
    let path: string | undefined;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
        exif: false,
      });
      if (!result.canceled && mounted.current) {
        const asset = result.assets[0];
        const saved = await saveAttachment(
          asset.uri,
          asset.fileName || 'Gear photo',
          asset.mimeType || 'image/jpeg',
        );
        path = saved.path;
        if (!mounted.current) {
          releaseAttachmentImport(path);
          return;
        }
        imported.current.add(path);
        await onChange?.(path);
      }
    } catch (e) {
      if (path) {
        imported.current.delete(path);
        releaseAttachmentImport(path);
      }
      Alert.alert(
        'Photo not saved',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      lock.current = false;
      if (mounted.current) {
        setBusy(false);
      }
    }
  };
  let uri: string | undefined;
  try {
    uri = value
      ? value.startsWith('file:') || value.startsWith('https:')
        ? value
        : attachmentUri(value)
      : undefined;
  } catch {
    /* Show replacement control for an invalid old reference. */
  }
  return (
    <View style={{ gap: 8, marginVertical: 12 }}>
      {uri && (
        <Image
          accessibilityLabel="Gear or drop bag photo"
          source={{ uri }}
          resizeMode="contain"
          style={{ width: '100%', height: 220, borderRadius: 12 }}
        />
      )}
      {onChange && (
        <>
          <Button
            disabled={busy || disabled}
            variant="secondary"
            onPress={pick}
          >
            {value ? 'Replace photo' : 'Add photo'}
          </Button>
          {!!value && (
            <Button
              disabled={busy || disabled}
              variant="tertiary"
              onPress={async () => {
                if (lock.current) {
                  return;
                }
                lock.current = true;
                setBusy(true);
                try {
                  await onChange(null);
                } catch {
                  Alert.alert('Photo not removed', 'Please try again.');
                } finally {
                  lock.current = false;
                  if (mounted.current) {
                    setBusy(false);
                  }
                }
              }}
            >
              Remove photo
            </Button>
          )}
          <BodySmall>Saved on this device for offline use.</BodySmall>
        </>
      )}
    </View>
  );
}

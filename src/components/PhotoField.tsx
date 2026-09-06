import React, { useState, useEffect } from 'react';
import { View, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BodySmall, Button } from './ui';
import { attachmentUri, saveAttachment } from '../lib/attachments';
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
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
  const pick = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
        exif: false,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        const saved = await saveAttachment(
          asset.uri,
          asset.fileName || 'Gear photo',
          asset.mimeType || 'image/jpeg',
        );
        await onChange?.(saved.path);
      }
    } catch (e) {
      Alert.alert(
        'Photo not saved',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setBusy(false);
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
                setBusy(true);
                try {
                  await onChange(null);
                } catch {
                  Alert.alert('Photo not removed', 'Please try again.');
                } finally {
                  setBusy(false);
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

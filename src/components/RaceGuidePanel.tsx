import React, { useState, useRef } from 'react';
import { Alert, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FS from 'expo-file-system/legacy';
import { useEvents } from '../context/EventContext';
import { Event } from '../lib/database.types';
import { saveAttachment, attachmentUri, attachmentShareUri, releaseAttachmentImport } from '../lib/attachments';
import { Button, H3, BodySmall, Card, CardContent } from './ui';
export default function RaceGuidePanel({ event }: { event: Event }) {
  const { updateEvent } = useEvents();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const work = async (fn: () => Promise<void>) => {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert(
        'Race guide',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const pick = () =>
    work(async () => {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) {
        return;
      }
      const a = result.assets[0];
      const file = await saveAttachment(a.uri, a.name, 'application/pdf');
      try {
        if (!(await updateEvent(event.id, { raceGuide: file }))) {
          throw new Error('Race no longer exists.');
        }
      } finally {
        releaseAttachmentImport(file.path);
      }
    });
  const share = () =>
    work(async () => {
      if (!event.raceGuide) {
        return;
      }
      const uri = attachmentUri(event.raceGuide.path);
      if (!(await FS.getInfoAsync(uri)).exists) {
        throw new Error('This saved PDF is missing. Attach the guide again.');
      }
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('File sharing is unavailable on this device.');
      }
      await Sharing.shareAsync(await attachmentShareUri(event.raceGuide), {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: event.raceGuide.name,
      });
    });
  return (
    <Card style={{ marginVertical: 12 }}>
      <CardContent>
        <H3>Official race guide</H3>
        <BodySmall style={{ marginVertical: 8 }}>
          {event.raceGuide?.name ||
            'Attach the organizer’s PDF to keep it with this race plan.'}
        </BodySmall>
        <View style={{ gap: 8 }}>
          {event.raceGuide && (
            <>
              <Button disabled={busy} onPress={share}>
                Open / share PDF
              </Button>
              <BodySmall>
                Saved for offline access on this device. Use the share sheet to
                open in a PDF reader or send a copy to your crew; attachments
                are not synced to the live team room.
              </BodySmall>
            </>
          )}
          <Button disabled={busy} variant="secondary" onPress={pick}>
            {event.raceGuide ? 'Replace PDF' : 'Attach PDF'}
          </Button>
          {event.raceGuide && (
            <Button
              disabled={busy}
              variant="tertiary"
              onPress={() =>
                Alert.alert(
                  'Remove race guide?',
                  'Remove the attachment from this plan?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      onPress: () =>
                        work(async () => {
                          await updateEvent(event.id, { raceGuide: null });
                        }),
                    },
                  ],
                )
              }
            >
              Remove PDF
            </Button>
          )}
        </View>
      </CardContent>
    </Card>
  );
}

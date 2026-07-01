/**
 * Supabase Storage helpers for course GPX files.
 *
 * Objects live in the private `gpx-files` bucket at {userId}/{eventId}.gpx.
 * Events store the storage object path in `gpx_file_url`; a plain `file:` URI
 * there means the route is device-local only (offline or signed-out import).
 */

import { File } from 'expo-file-system';
import { supabase } from './supabase';

const BUCKET = 'gpx-files';
const SIGNED_URL_TTL_SECONDS = 300;

export const isRemoteGpxPath = (value: string | null): value is string =>
  !!value && !value.startsWith('file:');

export const gpxStoragePath = (userId: string, eventId: string): string =>
  `${userId}/${eventId}.gpx`;

export async function uploadGpx(userId: string, eventId: string, localFile: File): Promise<string> {
  const path = gpxStoragePath(userId, eventId);
  const body = await localFile.text();
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: 'application/gpx+xml',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function downloadGpx(path: string, destination: File): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) throw error ?? new Error('Failed to create signed URL');
  if (destination.exists) destination.delete();
  const file = await File.downloadFileAsync(data.signedUrl, destination);
  return file.uri;
}

export async function removeGpx(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

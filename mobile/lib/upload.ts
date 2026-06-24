import { getAuthToken, getStrapiUrl, mediaUrl } from '@/lib/strapi';

type UploadResponse = Array<{ url?: string }>;

export async function uploadImageFromUri(localUri: string, fileName = 'work.jpg'): Promise<string> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to upload images');
  }

  const formData = new FormData();
  formData.append('files', {
    uri: localUri,
    name: fileName,
    type: 'image/jpeg',
  } as unknown as Blob);

  const res = await fetch(`${getStrapiUrl()}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const json = (await res.json().catch(() => [])) as UploadResponse | { error?: { message?: string } };
  if (!res.ok) {
    const message =
      !Array.isArray(json) && json.error?.message
        ? json.error.message
        : `Upload failed (${res.status})`;
    throw new Error(message);
  }

  const url = Array.isArray(json) ? json[0]?.url : undefined;
  const resolved = mediaUrl(url);
  if (!resolved) {
    throw new Error('Upload succeeded but no image URL was returned');
  }

  return resolved;
}

export function newWorkId() {
  return `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

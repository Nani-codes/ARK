import { getAuthToken, getStrapiUrl, mediaUrl } from '@/lib/strapi';

type UploadResponse = Array<{ id?: number; url?: string }>;

export type UploadedImage = {
  id: number;
  url: string;
};

export async function uploadImageFromUri(
  localUri: string,
  fileName = 'work.jpg'
): Promise<UploadedImage> {
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

  const file = Array.isArray(json) ? json[0] : undefined;
  const resolved = mediaUrl(file?.url);
  if (!file?.id || !resolved) {
    throw new Error('Upload succeeded but no image was returned');
  }

  return { id: file.id, url: resolved };
}

export async function uploadImagesFromUris(uris: string[]): Promise<UploadedImage[]> {
  const uploads: UploadedImage[] = [];
  for (let i = 0; i < uris.length; i++) {
    uploads.push(await uploadImageFromUri(uris[i], `project_${i + 1}.jpg`));
  }
  return uploads;
}

/** @deprecated Use uploadImageFromUri which returns { id, url } */
export async function uploadImageUrlFromUri(localUri: string, fileName = 'work.jpg'): Promise<string> {
  const uploaded = await uploadImageFromUri(localUri, fileName);
  return uploaded.url;
}

export function newWorkId() {
  return `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

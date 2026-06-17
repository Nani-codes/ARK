import fs from 'fs';
import path from 'path';

import type { Core } from '@strapi/strapi';

function resolveSeedAssetPath(file: string): string {
  const candidates = [
    path.resolve(__dirname, '..', '..', '..', 'seed-assets', file),
    path.join(process.cwd(), 'seed-assets', file),
    path.join(process.cwd(), 'cms', 'seed-assets', file),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

/** Upload a local seed-assets file into the Strapi media library. */
export async function uploadLocalImage(
  strapi: Core.Strapi,
  relativeFile: string,
  fileName: string,
  mime: string,
  alternativeText?: string
): Promise<number | null> {
  const existing = await strapi.db.query('plugin::upload.file').findOne({
    where: { name: fileName },
  });
  if (existing?.id) return existing.id as number;

  const absolutePath = resolveSeedAssetPath(relativeFile);
  if (!fs.existsSync(absolutePath)) {
    strapi.log.warn(`seed-media: missing file ${absolutePath}`);
    return null;
  }

  try {
    const stat = fs.statSync(absolutePath);
    const uploadService = strapi.plugin('upload').service('upload');
    const uploaded = await uploadService.upload({
      data: {
        fileInfo: {
          name: fileName,
          alternativeText: alternativeText ?? fileName,
        },
      },
      files: {
        filepath: absolutePath,
        originalFilename: fileName,
        mimetype: mime,
        size: stat.size,
      },
    });

    const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    return (file?.id as number | undefined) ?? null;
  } catch (err) {
    strapi.log.warn(`seed-media: could not upload ${fileName}: ${String(err)}`);
    return null;
  }
}

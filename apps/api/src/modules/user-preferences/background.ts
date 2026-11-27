import { randomUUID } from 'node:crypto';
import { db, MB, userPreference } from '@repo/db';
import { deleteObject, getObject, putObject } from '@repo/storage';
import { eq, sql } from 'drizzle-orm';
import { HttpError } from '#shared/lib';
import {
  accountBackgroundIdFromUrl,
  accountBackgroundObjectKey,
  accountBackgroundUrl,
} from '#shared/account-background';

const MAX_BACKGROUND_BYTES = 5 * MB;
const ALLOWED_TYPES = /^image\/(png|jpe?g|webp|avif)$/i;

export async function uploadBackground(userId: string, file: unknown): Promise<void> {
  if (!(file instanceof File)) throw new HttpError(400, 'No file uploaded (form field "file")');
  if (file.size === 0) throw new HttpError(400, 'Uploaded file is empty');
  if (file.size > MAX_BACKGROUND_BYTES) throw new HttpError(413, 'Image exceeds the 5 MB limit');
  if (!ALLOWED_TYPES.test(file.type)) {
    throw new HttpError(400, 'Background must be a PNG, JPEG, WebP, or AVIF image');
  }

  const id = randomUUID();
  const key = accountBackgroundObjectKey(userId, id);
  try {
    await putObject(key, Buffer.from(await file.arrayBuffer()), file.type);
  } catch (error) {
    console.error(`[planner] background image PUT failed (key=${key}, size=${file.size}):`, error);
    throw new HttpError(502, 'Object store error while uploading background image');
  }

  let previousImage: string | null | undefined;
  try {
    const [previous] = await db
      .select({ backgroundImage: userPreference.backgroundImage })
      .from(userPreference)
      .where(eq(userPreference.userId, userId));
    previousImage = previous?.backgroundImage;
    await db
      .insert(userPreference)
      .values({
        userId,
        backgroundImage: accountBackgroundUrl(id),
        backgroundEnabled: true,
      })
      .onConflictDoUpdate({
        target: userPreference.userId,
        set: {
          backgroundImage: accountBackgroundUrl(id),
          backgroundEnabled: true,
          updatedAt: sql`now()`,
        },
      });
  } catch (error) {
    await deleteObject(key).catch((deleteError) => {
      console.error(`[planner] failed to delete unreferenced background image ${id}:`, deleteError);
    });
    throw error;
  }

  const previousId = accountBackgroundIdFromUrl(previousImage);
  if (previousId) await deletePreviousBackground(userId, previousId);
}

export async function removeBackground(userId: string): Promise<void> {
  const [previous] = await db
    .select({ backgroundImage: userPreference.backgroundImage })
    .from(userPreference)
    .where(eq(userPreference.userId, userId));

  await db
    .insert(userPreference)
    .values({ userId, backgroundImage: null, backgroundEnabled: false })
    .onConflictDoUpdate({
      target: userPreference.userId,
      set: { backgroundImage: null, backgroundEnabled: false, updatedAt: sql`now()` },
    });

  const previousId = accountBackgroundIdFromUrl(previous?.backgroundImage);
  if (previousId) await deletePreviousBackground(userId, previousId);
}

export async function readBackground(userId: string, id: string) {
  const [preference] = await db
    .select({ backgroundImage: userPreference.backgroundImage })
    .from(userPreference)
    .where(eq(userPreference.userId, userId));

  if (preference?.backgroundImage !== accountBackgroundUrl(id)) {
    throw new HttpError(404, 'Background image not found');
  }

  try {
    return await getObject(accountBackgroundObjectKey(userId, id));
  } catch (error) {
    throw new HttpError(404, error instanceof Error ? error.message : 'Background image not found');
  }
}

async function deletePreviousBackground(userId: string, id: string): Promise<void> {
  await deleteObject(accountBackgroundObjectKey(userId, id)).catch((error) => {
    console.error(
      `[planner] failed to delete previous background image ${id}:`,
      error instanceof Error ? error.message : error,
    );
  });
}

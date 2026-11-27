const BACKGROUND_URL = '/protected-media/account/background';

export function accountBackgroundUrl(id: string): string {
  return `${BACKGROUND_URL}/${id}/raw`;
}

export function accountBackgroundIdFromUrl(url: string | null | undefined): string | null {
  const match = url?.match(
    /^\/protected-media\/account\/background\/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/raw$/i,
  );
  return match?.[1] ?? null;
}

export function accountBackgroundObjectKey(userId: string, id: string): string {
  return `user-backgrounds/${userId}/${id}`;
}

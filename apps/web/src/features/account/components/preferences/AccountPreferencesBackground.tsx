'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { AccountPreferences } from '@/lib/api/endpoints/userPreferences';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useRemoveAccountBackground,
  useUpdateAccountPreferences,
  useUploadAccountBackground,
} from '@/services/preferences.service';
import AccountPreferenceRow from '../AccountPreferenceRow';

export default function AccountPreferencesBackground({
  preferences,
}: {
  preferences: AccountPreferences;
}) {
  const t = useTranslations('account.preferences');
  const tProfile = useTranslations('account.profile');
  const inputRef = useRef<HTMLInputElement>(null);
  const update = useUpdateAccountPreferences();
  const upload = useUploadAccountBackground();
  const remove = useRemoveAccountBackground();
  const [opacity, setOpacity] = useState(preferences.backgroundOpacity);
  const settledOpacity = useDebouncedValue(opacity, 400);
  let uploadLabel = tProfile('upload');
  if (upload.isPending) uploadLabel = tProfile('uploading');
  else if (preferences.backgroundImage) uploadLabel = tProfile('change');

  useEffect(() => {
    if (settledOpacity !== preferences.backgroundOpacity) {
      update.mutate(
        { backgroundOpacity: settledOpacity },
        { onSuccess: () => toast.success(t('saved')) },
      );
    }
    // Saving a settled slider value must not restart the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settledOpacity]);

  function chooseFile(file: File | undefined) {
    if (!file) return;
    upload.mutate(file, { onSuccess: () => toast.success(t('saved')) });
  }

  return (
    <>
      <AccountPreferenceRow
        label={t('backgroundImage')}
        description={t('backgroundImageDescription')}
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={(event) => {
              chooseFile(event.currentTarget.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending || remove.isPending}
          >
            <ImagePlus />
            {uploadLabel}
          </Button>
          {preferences.backgroundImage && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('removeBackgroundImage')}
              title={t('removeBackgroundImage')}
              onClick={() =>
                remove.mutate(undefined, { onSuccess: () => toast.success(t('saved')) })
              }
              disabled={remove.isPending || upload.isPending}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </AccountPreferenceRow>
      {preferences.backgroundImage && (
        <>
          <AccountPreferenceRow label={t('useBackgroundImage')}>
            <Switch
              checked={preferences.backgroundEnabled}
              onCheckedChange={(backgroundEnabled) =>
                update.mutate({ backgroundEnabled }, { onSuccess: () => toast.success(t('saved')) })
              }
            />
          </AccountPreferenceRow>
          {preferences.backgroundEnabled && (
            <AccountPreferenceRow label={t('backgroundImageOpacity')}>
              <div className="flex w-full items-center gap-3 sm:w-44">
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={opacity}
                  onChange={(event) => setOpacity(Number(event.currentTarget.value))}
                  aria-label={t('backgroundImageOpacity')}
                  className="min-w-0 flex-1 accent-primary"
                />
                <span className="w-10 text-end text-xs text-muted-foreground tabular-nums">
                  {opacity}%
                </span>
              </div>
            </AccountPreferenceRow>
          )}
        </>
      )}
    </>
  );
}

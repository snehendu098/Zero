import { SettingsCard } from '@/components/settings/settings-card';
import { useMutation, useQuery } from '@tanstack/react-query';
import ThemesPage from '@/components/theme/theme-view';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTRPC } from '@/providers/query-provider';
import { useSettings } from '@/hooks/use-settings';
import { useTranslations } from 'use-intl';
import { useForm } from 'react-hook-form';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  colorTheme: z.enum(['dark', 'light', 'system', '']),
});

type Theme = 'dark' | 'light' | 'system';

export default function AppearancePage() {
  const t = useTranslations();
  const { data, refetch } = useSettings();
  const { theme, systemTheme, resolvedTheme, setTheme } = useTheme();
  const trpc = useTRPC();

  return (
    <div className="grid gap-6">
      <SettingsCard
        title={t('pages.settings.appearance.title')}
        description={t('pages.settings.appearance.description')}
      >
        <ThemesPage />
      </SettingsCard>
    </div>
  );
}

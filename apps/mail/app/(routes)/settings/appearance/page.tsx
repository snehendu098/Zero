import { SettingsCard } from '@/components/settings/settings-card';
import { zodResolver } from '@hookform/resolvers/zod';
import type { MessageKey } from '@/config/navigation';
import { useTRPC } from '@/providers/query-provider';
import { useMutation } from '@tanstack/react-query';
import { useSettings } from '@/hooks/use-settings';
import { Laptop, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'use-intl';
import { useForm } from 'react-hook-form';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';
import ThemesPage from '@/components/theme/theme-view';


const formSchema = z.object({
  colorTheme: z.enum(['dark', 'light', 'system', '']),
});

type Theme = 'dark' | 'light' | 'system';

export default function AppearancePage() {
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations();
  const { data, refetch } = useSettings();
  const { theme, systemTheme, resolvedTheme, setTheme } = useTheme();
  const trpc = useTRPC();
  const { mutateAsync: saveUserSettings } = useMutation(trpc.settings.save.mutationOptions());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      colorTheme: data?.settings.colorTheme || (theme as Theme),
    },
  });

  async function handleThemeChange(newTheme: string) {
    let nextResolvedTheme = newTheme;

    if (newTheme === 'system' && systemTheme) {
      nextResolvedTheme = systemTheme;
    }

    function update() {
      setTheme(newTheme);
      form.setValue('colorTheme', newTheme as z.infer<typeof formSchema>['colorTheme']);
    }

    if (document.startViewTransition && nextResolvedTheme !== resolvedTheme) {
      document.documentElement.style.viewTransitionName = 'theme-transition';
      await document.startViewTransition(update).finished;
      document.documentElement.style.viewTransitionName = '';
    } else {
      update();
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (data) {
      setIsSaving(true);
      toast.promise(
        saveUserSettings({
          ...data.settings,
          colorTheme: values.colorTheme as Theme,
        }),
        {
          success: t('common.settings.saved'),
          error: t('common.settings.failedToSave'),
          finally: async () => {
            await refetch();
            setIsSaving(false);
          },
        },
      );
    }
  }

  if (!data?.settings) return null;

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

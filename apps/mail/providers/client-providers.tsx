import { ThemeContextProvider } from '@/components/context/theme-context';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PostHogProvider } from '@/lib/posthog-provider';
import { useSettings } from '@/hooks/use-settings';
import { Provider as JotaiProvider } from 'jotai';
import type { PropsWithChildren } from 'react';
import Toaster from '@/components/ui/toast';
import { ThemeProvider } from 'next-themes';

export function ClientProviders({ children }: PropsWithChildren) {
  const { data } = useSettings();

  const theme = data?.settings.colorTheme || 'system';

  return (
    <NuqsAdapter>
      <JotaiProvider>
        <ThemeContextProvider>
          <SidebarProvider>
            <PostHogProvider>
              {children}
              <Toaster />
            </PostHogProvider>
          </SidebarProvider>
        </ThemeContextProvider>
      </JotaiProvider>
    </NuqsAdapter>
  );
}

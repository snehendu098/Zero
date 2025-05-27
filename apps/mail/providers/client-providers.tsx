import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PostHogProvider } from '@/lib/posthog-provider';
import { useSettings } from '@/hooks/use-settings';
import CustomToaster from '@/components/ui/toast';
import { Provider as JotaiProvider } from 'jotai';
import type { PropsWithChildren } from 'react';
import { ThemeProvider } from 'next-themes';
import { ThemeContextProvider } from '@/components/context/theme-context';

export function ClientProviders({ children }: PropsWithChildren) {

  const { data } = useSettings();

  const theme = data?.settings.colorTheme || 'system';

  return (
    <NuqsAdapter>
      <JotaiProvider>
        <ThemeProvider
          attribute="class"
          enableSystem
          disableTransitionOnChange
          defaultTheme={theme}
        >
          <ThemeContextProvider>
            <SidebarProvider>
              <PostHogProvider>
                {children}
                <CustomToaster />
              </PostHogProvider>
            </SidebarProvider>
          </ThemeContextProvider>
        </ThemeProvider>
      </JotaiProvider>
    </NuqsAdapter>
  );
}

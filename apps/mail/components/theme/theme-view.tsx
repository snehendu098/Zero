import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCurrentTheme } from '@/components/context/theme-context';
import type { ThemeColorSchema } from '@zero/server/schemas';
import ThemeCreator, { hslToHex } from './theme-customizer';
import { Check, Moon, Plus, Sun, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { useThemes } from '@/hooks/use-themes';
import { defaultThemes } from '@/lib/themes';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const dialogVariants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: 50, // Start slightly lower
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
      mass: 0.7,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: 50, // Exit downwards
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export default function ThemesPage() {
  const { activeTheme: selectedTheme, applyTheme, revertToDefault } = useCurrentTheme();
  const [open, setOpen] = useState<boolean>(false);

  const { useUserThemes } = useThemes();

  const { data: userThemesData, isLoading, isError } = useUserThemes();

  console.log(isLoading, userThemesData, isError);

  const handleThemeClick = (themeData: ThemeColorSchema, dark: boolean, id: string) => {
    console.log(themeData);
    console.log('✨ Applying new theme');

    applyTheme(themeData, dark, `${id}-${dark ? 'dark' : 'light'}`);
  };

  const handleDefaultThemeClick = (theme: (typeof defaultThemes)[0]) => {
    const [name, variant] = (theme.name as string).toLowerCase().split(' ');

    console.log(
      '🖱️ Default theme clicked:',
      (theme.name as string).toLowerCase().split(' ').join('-'),
      'Currently selected:',
      selectedTheme,
    );

    if (`${name}-${variant}` !== selectedTheme) {
      if (variant === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    revertToDefault(variant as 'light' | 'dark');
  };

  return (
    <div className="text-foreground h-full">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-12">
          {/* Default Themes Section */}
          <section>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">Your Themes</h3>
                <p className="text-muted-foreground">Built-in themes and your created themes</p>
              </div>

              <Button onClick={() => setOpen(true)} className="flex items-center">
                <Plus className="h-4 w-4" />
                Create
              </Button>

              <AnimatePresence>
                {open && (
                  <div
                    // This outer div acts as a portal target and ensures correct stacking context
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    aria-labelledby="theme-creator-dialog"
                    role="dialog"
                    aria-modal="true"
                  >
                    {/* Backdrop */}
                    <motion.div
                      key="backdrop"
                      variants={backdropVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute inset-0 bg-black/60" // Slightly darker backdrop
                      onClick={() => setOpen(false)}
                    />

                    {/* Dialog Content */}
                    <motion.div
                      key="dialog-content"
                      variants={dialogVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="bg-background border-border relative flex h-[95vh] w-[95vw] max-w-none flex-col overflow-hidden rounded-lg border shadow-2xl" // Added flex flex-col
                    >
                      {/* Close Button - ensure it's above the ThemeCreator content */}
                      <button
                        onClick={() => setOpen(false)}
                        className="hover:bg-muted focus-visible:ring-ring absolute right-3 top-3 z-20 rounded-full p-2 transition-colors focus:outline-none focus-visible:ring-2"
                        aria-label="Close theme creator"
                      >
                        <X className="h-5 w-5" /> {/* Slightly larger icon */}
                      </button>

                      {/* Theme Creator - ensure it takes full height and allows internal scrolling */}
                      <div className="flex-1 overflow-hidden">
                        {' '}
                        {/* This div will contain ThemeCreator and manage its overflow */}
                        <ThemeCreator />
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {defaultThemes.map((theme, index) => (
                <div key={theme.id} className="contents">
                  <Card
                    className={`cursor-pointer overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                      selectedTheme === theme.id ? 'ring-primary shadow-lg ring-2' : ''
                    }`}
                    onClick={() => {
                      handleDefaultThemeClick(theme);
                      // console.log(selectedTheme, theme.id);
                    }}
                  >
                    <div
                      className="relative flex h-32 items-center justify-center"
                      style={{
                        backgroundColor: theme.variant === 'dark' ? '#1F2937' : '#F8F9FA',
                        color: theme.variant === 'dark' ? '#ffffff' : '#000000',
                      }}
                    >
                      {theme.variant === 'dark' ? (
                        <Moon className="h-12 w-12" />
                      ) : (
                        <Sun className="h-12 w-12" />
                      )}
                      {selectedTheme === theme.id && (
                        <div className="bg-primary/20 absolute right-2 top-2 rounded-full p-1">
                          <Check className="text-primary h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{theme.name}</CardTitle>
                    </CardHeader>
                    <CardFooter className="pt-0">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex gap-1">
                          {Object.values(theme.colors)
                            .slice(0, 3)
                            .map((color, colorIndex) => (
                              <div
                                key={colorIndex}
                                className="h-3 w-3 rounded-full border border-gray-200"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                        </div>
                        {selectedTheme === theme.id && <Check className="text-primary h-4 w-4" />}
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              ))}
            </div>
          </section>

          {/* User made themes */}
          {userThemesData && userThemesData?.themes.length > 0 && (
            <section>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold">Themes</h3>
                  <p className="text-muted-foreground">
                    Customize how you want your interface should look
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* themes */}
                {userThemesData.themes.map((item, idx) => {
                  const { rootColors, darkColors } = item.themeData;

                  return (
                    <>
                      {item.themeData['darkColors'] && (
                        <Card
                          onClick={() => darkColors && handleThemeClick(darkColors, true, item.id)}
                          className={cn(
                            'relative',
                            selectedTheme === `${item.id}-dark`
                              ? 'ring-primary shadow-lg ring-2'
                              : '',
                          )}
                        >
                          {/* {selectedTheme === `${item.id}-dark` && (
                            <div className="bg-primary/20 absolute right-2 top-2 rounded-full p-1">
                              <Check className="text-primary h-4 w-4" />
                            </div>
                          )} */}
                          <CardHeader>
                            <CardTitle>{item.name}</CardTitle>
                            <CardDescription>{item.description}</CardDescription>
                            <div className="absolute bottom-2 right-2 rounded-full border px-2 text-xs font-semibold">
                              Dark
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center space-x-2">
                              <div
                                className={cn('rounded-full border p-4')}
                                style={{
                                  backgroundColor: item.themeData['darkColors'].background
                                    ? hslToHex(item.themeData['darkColors'].background)
                                    : '#ffffff',
                                }}
                              ></div>

                              <div
                                className={cn('rounded-full border p-4')}
                                style={{
                                  backgroundColor: item.themeData['darkColors'].sidebar
                                    ? hslToHex(item.themeData['darkColors'].sidebar)
                                    : '#ffffff',
                                }}
                              ></div>

                              <div
                                className={cn('rounded-full border p-4')}
                                style={{
                                  backgroundColor: item.themeData['darkColors'].primary
                                    ? hslToHex(item.themeData['darkColors'].primary)
                                    : '#ffffff',
                                }}
                              ></div>
                              <div
                                className={cn('rounded-full border p-4')}
                                style={{
                                  backgroundColor: item.themeData['darkColors'].accent
                                    ? hslToHex(item.themeData['darkColors'].accent)
                                    : '#ffffff',
                                }}
                              ></div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {item.themeData['rootColors'] && (
                        <Card
                          onClick={() => rootColors && handleThemeClick(rootColors, false, item.id)}
                          className={cn(
                            'relative',
                            selectedTheme === `${item.id}-light`
                              ? 'ring-primary shadow-lg ring-2'
                              : '',
                          )}
                        >
                          {/* {selectedTheme === `${item.id}-light` && (
                            <div className="bg-primary/20 absolute right-2 top-2 rounded-full p-1">
                              <Check className="text-primary h-4 w-4" />
                            </div>
                          )} */}
                          <CardHeader>
                            <CardTitle>{item.name}</CardTitle>
                            <CardDescription>{item.description}</CardDescription>
                            <div className="absolute bottom-2 right-2 rounded-full border px-2 text-xs font-semibold">
                              Light
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center space-x-2">
                              <div
                                className={cn('rounded-full border p-4')}
                                style={{
                                  backgroundColor: item.themeData['rootColors'].background
                                    ? hslToHex(item.themeData['rootColors'].background)
                                    : '#ffffff',
                                }}
                              ></div>

                              <div
                                className={cn('rounded-full border p-4')}
                                style={{
                                  backgroundColor: item.themeData['rootColors'].sidebar
                                    ? hslToHex(item.themeData['rootColors'].sidebar)
                                    : '#ffffff',
                                }}
                              ></div>

                              <div
                                className={cn('rounded-full border p-4')}
                                style={{
                                  backgroundColor: item.themeData['rootColors'].primary
                                    ? hslToHex(item.themeData['rootColors'].primary)
                                    : '#ffffff',
                                }}
                              ></div>
                              <div
                                className={cn('rounded-full border p-4')}
                                style={{
                                  backgroundColor: item.themeData['rootColors'].accent
                                    ? hslToHex(item.themeData['rootColors'].accent)
                                    : '#ffffff',
                                }}
                              ></div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  );
                })}
              </div>
            </section>
          )}

          {/* Custom Themes Section */}
          {/* <section>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">Custom Themes</h3>
                <p className="text-muted-foreground">Handcrafted themes for unique experiences</p>
              </div>
              <span className="text-muted-foreground text-sm">{customThemes.length} themes</span>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {customThemes.map((theme, index) => {
                const isSelected = selectedTheme === theme.id;

                return (
                  <div key={theme.id} className="contents">
                    <Card
                      className={`cursor-pointer overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                        isSelected ? 'ring-primary shadow-lg ring-2' : ''
                      }`}
                      onClick={() => handleThemeClick(theme.id as ThemeOption)}
                    >
                      <div
                        className="relative flex h-32 items-center justify-center"
                        style={{
                          backgroundColor:
                            theme.variant === 'dark' ? '#1F2937' : theme.colors.primary,
                          color: theme.variant === 'dark' ? theme.colors.primary : '#ffffff',
                        }}
                      >
                        {theme.variant === 'dark' ? (
                          <Moon className="h-12 w-12" />
                        ) : (
                          <Sun className="h-12 w-12" />
                        )}
                        {isSelected && (
                          <div className="absolute right-2 top-2 rounded-full bg-white/20 p-1">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg capitalize">
                          {theme.name} {theme.variant}
                        </CardTitle>
                      </CardHeader>
                      <CardFooter className="pt-0">
                        <div className="flex w-full items-center justify-between">
                          <div className="flex gap-1">
                            {Object.values(theme.colors)
                              .slice(0, 3)
                              .map((color, colorIndex) => (
                                <div
                                  key={colorIndex}
                                  className="h-3 w-3 rounded-full border border-gray-200"
                                  style={{ backgroundColor: color as any }}
                                />
                              ))}
                          </div>
                          {isSelected && <Check className="text-primary h-4 w-4" />}
                        </div>
                      </CardFooter>
                    </Card> */}

          {/* Show preview after this theme if it should be shown */}
          {/* {shouldShowPreviewAfter(index, customThemes) && renderPreviewPanel()} */}
          {/* </div>
                );
              })} */}
          {/* </div>
          </section> */}
        </div>
      </main>
    </div>
  );
}

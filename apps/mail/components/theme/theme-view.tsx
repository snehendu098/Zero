import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { generateCustomThemeData, parseTheme } from '@/lib/themes/theme-utils';
import { useCurrentTheme } from '@/components/context/theme-context';
import { Check, Moon, Plus, Sun, X } from 'lucide-react';
import type { ThemeData, ThemeOption } from '@/types';
import { Button } from '@/components/ui/button';
import { useThemes } from '@/hooks/use-themes';
import { defaultThemes } from '@/lib/themes';
import { Link } from 'react-router';
import { useState } from 'react';
import ThemeCustomizer from './theme-customizer';
import { AnimatePresence, motion } from 'motion/react';

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
      type: "spring",
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
      ease: "easeOut",
    },
  },
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}


export default function ThemesPage() {
  const {
    activeTheme: selectedTheme,
    applyTheme,
    revertToDefault,
    customThemes: userCustomThemes,
  } = useCurrentTheme();
  const [previewTheme, setPreviewTheme] = useState<ThemeOption | null>(null);
  const [open, setOpen] = useState<boolean>(false)

  // Generate custom themes from API data using utility function
  const userThemes = generateCustomThemeData(userCustomThemes);

  const { useUserThemes } = useThemes();

  const { data: userThemesData, isLoading, isError } = useUserThemes();

  console.log(isLoading, userThemesData, isError);

  const handleThemeClick = (themeParams: ThemeData) => {
    console.log('🖱️ Theme clicked:', themeParams.name, 'Currently selected:', selectedTheme);
    console.log('✨ Applying new theme');
    applyTheme(themeParams);
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

  const closePreview = () => {
    setPreviewTheme(null);
  };

  // Helper function to determine if preview should be shown after this theme
  const shouldShowPreviewAfter = (themeIndex: number, themes: any[]) => {
    if (!previewTheme) return false;

    const previewThemeIndex = themes.findIndex((theme) => theme.id === previewTheme);
    if (previewThemeIndex === -1) return false;

    const themesPerRow = 4;
    const previewThemeRow = Math.floor(previewThemeIndex / themesPerRow);
    const currentThemeRow = Math.floor(themeIndex / themesPerRow);
    const lastThemeInRow = (currentThemeRow + 1) * themesPerRow - 1;
    const isLastThemeInPreviewRow =
      themeIndex === Math.min(lastThemeInRow, themes.length - 1) &&
      currentThemeRow === previewThemeRow;

    return isLastThemeInPreviewRow;
  };

  const renderPreviewPanel = () => (
    <div className="col-span-full">
      <Card className="border-primary/20 from-primary/5 mt-6 border-2 bg-gradient-to-r to-transparent">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Theme Preview</CardTitle>
            <CardDescription>Preview</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={closePreview}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons Preview */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Buttons</h4>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>

          {/* Colors Preview */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Colors</h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="space-y-1">
                <div className="bg-primary text-primary-foreground flex h-12 items-center justify-center rounded-md text-xs font-medium">
                  Primary
                </div>
                <p className="text-muted-foreground text-center text-xs">primary</p>
              </div>
              <div className="space-y-1">
                <div className="bg-secondary text-secondary-foreground flex h-12 items-center justify-center rounded-md text-xs font-medium">
                  Secondary
                </div>
                <p className="text-muted-foreground text-center text-xs">secondary</p>
              </div>
              <div className="space-y-1">
                <div className="bg-accent text-accent-foreground flex h-12 items-center justify-center rounded-md text-xs font-medium">
                  Accent
                </div>
                <p className="text-muted-foreground text-center text-xs">accent</p>
              </div>
              <div className="space-y-1">
                <div className="bg-muted text-muted-foreground flex h-12 items-center justify-center rounded-md text-xs font-medium">
                  Muted
                </div>
                <p className="text-muted-foreground text-center text-xs">muted</p>
              </div>
            </div>
          </div>

          {/* Components Preview */}
          <div>
            <h4 className="mb-3 text-sm font-medium">Components</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="max-w-sm">
                <CardHeader>
                  <CardTitle>Sample Card</CardTitle>
                  <CardDescription>This is how cards look with this theme</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Content area with theme colors applied.</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>

              <div className="space-y-3">
                <h5 className="text-sm font-medium">Typography</h5>
                <div className="space-y-2">
                  <h6 className="font-semibold">Heading Text</h6>
                  <p className="text-muted-foreground text-sm">
                    This is how regular text appears with the selected theme.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
              className="relative bg-background border border-border rounded-lg shadow-2xl w-[95vw] h-[95vh] max-w-none overflow-hidden flex flex-col" // Added flex flex-col
            >
              {/* Close Button - ensure it's above the ThemeCreator content */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 z-20 p-2 rounded-full hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close theme creator"
              >
                <X className="w-5 h-5" /> {/* Slightly larger icon */}
              </button>

              {/* Theme Creator - ensure it takes full height and allows internal scrolling */}
              <div className="flex-1 overflow-hidden">
                {" "}
                {/* This div will contain ThemeCreator and manage its overflow */}
                <ThemeCustomizer />
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

                  {/* Show preview after this theme if it should be shown */}
                  {shouldShowPreviewAfter(index, defaultThemes) && renderPreviewPanel()}
                </div>
              ))}
            </div>
          </section>

          {/* User made themes */}
          {userThemesData && userThemesData?.themes.length > 0 && (
            <section>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold">Created Themes</h3>
                  <p className="text-muted-foreground">Your Created Themes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {parseTheme(userThemesData).map((theme, index) => {
                  const isSelected = selectedTheme === `${theme.id}-${theme.variant}`;

                  return (
                    <div key={theme.id} className="contents">
                      <Card
                        className={`cursor-pointer overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                          isSelected ? 'ring-primary shadow-lg ring-2' : ''
                        }`}
                        onClick={() => {
                          if (isSelected) revertToDefault();
                          else handleThemeClick(theme);
                        }}
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
                      </Card>

                      {/* Show preview after this theme if it should be shown */}
                      {shouldShowPreviewAfter(index, userThemes) && renderPreviewPanel()}
                    </div>
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

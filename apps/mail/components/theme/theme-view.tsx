'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { generateCustomThemeData, generateThemeData } from '@/lib/themes/theme-utils';
import { useCurrentTheme } from '@/components/context/theme-context';
import { Check, Moon, Plus, Sun, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { themesApiReponse } from '@/lib/themes';
import type { ThemeOption } from '@/types';
import { Link } from 'react-router';
import { useState } from 'react';

export default function ThemesPage() {
  const {
    activeTheme: selectedTheme,
    applyTheme,
    revertToDefault,
    parseThemeOption,
    customThemes: userCustomThemes,
  } = useCurrentTheme();
  const [previewTheme, setPreviewTheme] = useState<ThemeOption | null>(null);

  const defaultThemes = [
    {
      id: 'default-light',
      name: 'Default Light',
      variant: 'light' as const,
      description: 'System default light theme from your design system',
      colors: {
        primary: '#000000',
        secondary: '#f1f5f9',
        accent: '#f1f5f9',
        muted: '#f1f5f9',
      },
    },
    {
      id: 'default-dark',
      name: 'Default Dark',
      variant: 'dark' as const,
      description: 'System default dark theme from your design system',
      colors: {
        primary: '#ffffff',
        secondary: '#1e293b',
        accent: '#1e293b',
        muted: '#1e293b',
      },
    },
  ];

  // Generate custom themes from API data using utility function
  const customThemes = generateThemeData(themesApiReponse);
  const userThemes = generateCustomThemeData(userCustomThemes);

  const handleThemeClick = (themeOption: ThemeOption) => {
    console.log('🖱️ Theme clicked:', themeOption, 'Currently selected:', selectedTheme);

    // For default themes, always apply directly - no special logic
    if (themeOption.startsWith('default-')) {
      applyTheme(themeOption);
      setPreviewTheme(themeOption);
      return;
    }

    // For non-default themes, if clicking on already selected theme, revert to default
    if (themeOption === selectedTheme) {
      console.log('🔄 Reverting to default theme');
      revertToDefault();
      setPreviewTheme(null);
    } else {
      console.log('✨ Applying new theme');
      applyTheme(themeOption);
      setPreviewTheme(themeOption);
    }
  };

  const closePreview = () => {
    setPreviewTheme(null);
  };

  const getDisplayName = (option: ThemeOption) => {
    const { name, variant } = parseThemeOption(option);
    const displayName =
      name === 'default' ? 'Default' : name.charAt(0).toUpperCase() + name.slice(1);
    return `${displayName} ${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
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
            <CardDescription>
              Preview of {previewTheme && getDisplayName(previewTheme)} theme
            </CardDescription>
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
              <Link to={'/settings/appearance/create'}>
                <Button className="flex items-center">
                  <Plus className="h-4 w-4" />
                  Create
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {defaultThemes.map((theme, index) => (
                <div key={theme.id} className="contents">
                  <Card
                    className={`cursor-pointer overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                      selectedTheme === theme.id ? 'ring-primary shadow-lg ring-2' : ''
                    }`}
                    onClick={() => handleThemeClick(theme.id as ThemeOption)}
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

          {/* Custom made themes */}
          {userThemes.length > 0 && (
            <section>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold">Created Themes</h3>
                  <p className="text-muted-foreground">Your Created Themes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {userThemes.map((theme, index) => {
                  const isSelected = selectedTheme === theme.id;

                  return (
                    <div key={theme.id} className="contents">
                      <Card
                        className={`cursor-pointer overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                          isSelected ? 'ring-primary shadow-lg ring-2' : ''
                        }`}
                        onClick={() => {
                          console.log(theme.css);
                          handleThemeClick(theme.id as ThemeOption);
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
          <section>
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
                    </Card>

                    {/* Show preview after this theme if it should be shown */}
                    {shouldShowPreviewAfter(index, customThemes) && renderPreviewPanel()}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

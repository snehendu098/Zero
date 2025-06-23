'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette, Sun, Moon, Globe, CornerDownRight, SaveIcon } from 'lucide-react';
import type { CreateTheme, ThemeDataSchema } from '@zero/server/schemas';
import { useState, useEffect, useRef, useCallback } from 'react';
import { hexToHsl, hslToHex } from '@/lib/themes/theme-utils';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useThemes } from '@/hooks/use-themes';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SketchPicker } from 'react-color';
import { toast } from 'sonner';
import type React from 'react';

// Theme variable definitions
const defaultDarkTheme = {
  radius: '0.5rem',
  background: '270 7% 8%',
  foreground: '0 0% 95%',
  card: '270 7% 10%',
  'card-foreground': '0 0% 95%',
  popover: '270 7% 10%',
  'popover-foreground': '0 0% 95%',
  primary: '328 85% 42%',
  'primary-foreground': '0 0% 100%',
  secondary: '270 30% 15%',
  'secondary-foreground': '0 0% 95%',
  muted: '270 10% 15%',
  'muted-foreground': '0 0% 65%',
  accent: '328 85% 42%',
  'accent-foreground': '0 0% 100%',
  destructive: '0 85% 60%',
  'destructive-foreground': '0 0% 100%',
  border: '270 10% 18%',
  input: '270 10% 15%',
  ring: '328 85% 42%',
  sidebar: '270 7% 8%',
  'sidebar-foreground': '0 0% 95%',
  'sidebar-primary': '328 85% 42%',
  'sidebar-primary-foreground': '0 0% 100%',
  'sidebar-accent': '270 10% 15%',
  'sidebar-accent-foreground': '0 0% 95%',
  'sidebar-border': '270 10% 15%',
  'sidebar-ring': '328 85% 42%',
  'shadow-color': '0 0% 0%',
};

const defaultLightTheme = {
  radius: '0.5rem',
  background: '0 0% 100%',
  foreground: '240 10% 3.9%',
  card: '0 0% 100%',
  'card-foreground': '240 10% 3.9%',
  popover: '0 0% 100%',
  'popover-foreground': '240 10% 3.9%',
  primary: '328 85% 42%',
  'primary-foreground': '0 0% 100%',
  secondary: '240 4.8% 95.9%',
  'secondary-foreground': '240 5.9% 10%',
  muted: '240 4.8% 95.9%',
  'muted-foreground': '240 3.8% 46.1%',
  accent: '240 4.8% 95.9%',
  'accent-foreground': '240 5.9% 10%',
  destructive: '0 84.2% 60.2%',
  'destructive-foreground': '0 0% 98%',
  border: '240 5.9% 90%',
  input: '240 5.9% 90%',
  ring: '328 85% 42%',
  sidebar: '0 0% 100%',
  'sidebar-foreground': '240 10% 3.9%',
  'sidebar-primary': '328 85% 42%',
  'sidebar-primary-foreground': '0 0% 100%',
  'sidebar-accent': '240 4.8% 95.9%',
  'sidebar-accent-foreground': '240 5.9% 10%',
  'sidebar-border': '240 5.9% 90%',
  'sidebar-ring': '328 85% 42%',
  'shadow-color': '0 0% 0%',
};

// Color groups for organization
const colorGroups = [
  {
    name: 'Core Colors',
    variables: ['background', 'foreground', 'card', 'card-foreground'],
  },
  {
    name: 'Primary & Actions',
    variables: [
      'primary',
      'primary-foreground',
      'secondary',
      'secondary-foreground',
      'destructive',
      'destructive-foreground',
    ],
  },
  {
    name: 'Muted & Borders',
    variables: ['muted', 'muted-foreground', 'border', 'input'],
  },
  {
    name: 'Sidebar',
    variables: [
      'sidebar',
      'accent',
      'sidebar-foreground',
      'sidebar-accent',
      'sidebar-accent-foreground',
    ],
  },
];

const generateThemeStyles = (theme: typeof defaultDarkTheme): React.CSSProperties => {
  const styles: Record<string, string> = {};
  Object.entries(theme).forEach(([key, value]) => {
    styles[`--${key}` as any] = value;
  });
  return styles as React.CSSProperties;
};

// Parse rem value to number (e.g. "0.5rem" -> 0.5)
function parseRemValue(remValue: string): number {
  const match = remValue.match(/^([\d.]+)rem$/);
  return match ? Number.parseFloat(match[1]) : 0.5; // Default to 0.5 if parsing fails
}

// Format number to rem string (e.g. 0.5 -> "0.5rem")
function formatRemValue(value: number): string {
  return `${value}rem`;
}

export default function ThemeCreator() {
  // Theme settings state
  const [themeName, setThemeName] = useState('My Custom Theme');
  const [themeDescription, setThemeDescription] = useState('');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'both'>('both');
  const [isPublic, setIsPublic] = useState(false);

  // Separate theme states for light and dark modes
  const [lightTheme, setLightTheme] = useState(defaultLightTheme);
  const [darkTheme, setDarkTheme] = useState(defaultDarkTheme);

  // Current editing state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeColorVar, setActiveColorVar] = useState<string | null>(null);
  const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 });
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { createTheme } = useThemes();

  // Get current theme based on editing mode
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // Radius state - initialize from current theme
  const [radiusValue, setRadiusValue] = useState(() => parseRemValue(currentTheme.radius));

  // Apply theme to iframe using multiple approaches
  const applyThemeToIframe = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (theme: typeof defaultDarkTheme, isDark: boolean) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const iframe = iframeRef.current;
          if (!iframe) return;

          // Method 1: Try direct DOM access (same origin)
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
              const root = iframeDoc.documentElement;

              // Apply CSS variables
              Object.entries(theme).forEach(([key, value]) => {
                root.style.setProperty(`--${key}`, value as string);
              });

              // Apply theme classes
              root.classList.toggle('dark', isDark);
              root.classList.toggle('light', !isDark);

              return; // Success, exit early
            }
          } catch (error) {
            // Expected for cross-origin iframes, continue to next method
          }

          // Method 2: PostMessage fallback
          try {
            if (iframe.contentWindow) {
              iframe.contentWindow.postMessage(
                {
                  type: 'THEME_UPDATE',
                  theme,
                  isDarkMode: isDark,
                },
                '*', // In production, use specific origin
              );
            }
          } catch (error) {
            console.warn('Failed to apply theme to iframe:', error);
          }

          // Method 3: URL parameter approach (as last resort)
          // This would require reloading the iframe, so we skip it for real-time updates
        }, 50); // Reduced debounce for better responsiveness
      };
    })(),
    [],
  );

  // Handle radius changes
  const handleRadiusChange = useCallback(
    (newRadius: number) => {
      setRadiusValue(newRadius);
      const radiusString = formatRemValue(newRadius);

      if (isDarkMode) {
        setDarkTheme((prev) => ({ ...prev, radius: radiusString }));
      } else {
        setLightTheme((prev) => ({ ...prev, radius: radiusString }));
      }
    },
    [isDarkMode],
  );

  // Update radius value when switching between themes
  useEffect(() => {
    const newRadiusValue = parseRemValue(currentTheme.radius);
    setRadiusValue(newRadiusValue);
  }, [isDarkMode]); // Only depend on isDarkMode, not currentTheme.radius

  // Apply theme changes to iframe
  useEffect(() => {
    applyThemeToIframe(currentTheme, isDarkMode);
  }, [currentTheme, isDarkMode, applyThemeToIframe]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    // Add message listener to iframe content (if same origin)
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc && iframe.contentWindow) {
        // Inject theme listener script into iframe
        const script = iframeDoc.createElement('script');
        script.textContent = `
          (function() {
            function applyTheme(theme, isDarkMode) {
              const root = document.documentElement;
              Object.entries(theme).forEach(([key, value]) => {
                root.style.setProperty('--' + key, value);
              });
              root.classList.toggle('dark', isDarkMode);
              root.classList.toggle('light', !isDarkMode);
            }
            
            window.addEventListener('message', function(event) {
              if (event.data && event.data.type === 'THEME_UPDATE') {
                applyTheme(event.data.theme, event.data.isDarkMode);
              }
            });
          })();
        `;

        // Remove existing script if present
        const existingScript = iframeDoc.querySelector('#theme-listener');
        if (existingScript) {
          existingScript.remove();
        }

        script.id = 'theme-listener';
        iframeDoc.head.appendChild(script);
      }
    } catch (error) {
      // Cross-origin iframe, the postMessage will still work
    }

    // Apply initial theme
    applyThemeToIframe(currentTheme, isDarkMode);
  }, [currentTheme, isDarkMode, applyThemeToIframe]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setActiveColorVar(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleColorChange = (color: any, variable: string) => {
    const hslValue = hexToHsl(color.hex);

    if (isDarkMode) {
      setDarkTheme((prev) => ({ ...prev, [variable]: hslValue }));
    } else {
      setLightTheme((prev) => ({ ...prev, [variable]: hslValue }));
    }
  };

  // Handle save theme
  const handleSaveTheme = async () => {
    const themeOutput: ThemeDataSchema = {};

    if (themeMode === 'light') {
      // Only light mode
      themeOutput.rootColors = lightTheme;
    } else if (themeMode === 'dark') {
      // Only dark mode
      themeOutput.darkColors = darkTheme;
    } else {
      // Both modes
      themeOutput.rootColors = lightTheme;
      themeOutput.darkColors = darkTheme;
    }

    const themePayload: CreateTheme = {
      name: themeName.trim(),
      description: themeDescription.trim(),
      themeData: themeOutput,
      isPublic,
    };

    try {
      await createTheme.mutateAsync(themePayload);
      toast.success('Theme created successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create theme. Please try again.');
    }
  };

  const ColorInput = ({ variable, label }: { variable: string; label: string }) => {
    const inputRef = useRef<HTMLDivElement>(null);
    const currentValue = currentTheme[variable as keyof typeof currentTheme];
    const hexValue = hslToHex(currentValue);

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();

      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const colorPickerHeight = 350;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        const shouldPositionAbove =
          spaceBelow < colorPickerHeight && spaceAbove > colorPickerHeight;

        let top: number;
        let left: number = rect.left + window.scrollX;

        if (shouldPositionAbove) {
          top = rect.top + window.scrollY - colorPickerHeight - 5;
        } else {
          top = rect.bottom + window.scrollY + 5;
        }

        const colorPickerWidth = 225;
        const maxLeft = window.innerWidth - colorPickerWidth - 5;
        left = Math.min(left, maxLeft);
        left = Math.max(left, 10);

        setColorPickerPosition({ top, left });
      }

      setActiveColorVar(variable);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.trim();

      if (isDarkMode) {
        setDarkTheme((prev) => ({ ...prev, [variable]: value }));
      } else {
        setLightTheme((prev) => ({ ...prev, [variable]: value }));
      }
    };

    return (
      <div className="space-y-2">
        <Label htmlFor={variable} className="text-sm font-medium">
          {label}
        </Label>
        <div className="flex items-center space-x-2">
          <div
            ref={inputRef}
            onClick={handleClick}
            className="border-border relative flex h-8 w-12 cursor-pointer items-center justify-center overflow-hidden rounded border"
            style={{ backgroundColor: hexValue }}
          >
            <div className="absolute inset-0" style={{ backgroundColor: hexValue }}></div>
          </div>
          <Input
            value={currentValue}
            onChange={handleInputChange}
            className="flex-1 font-mono text-xs"
            placeholder="HSL value"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-background flex h-full">
      {/* Left Panel - Controls */}
      <div className="bg-card border-border w-80 flex-shrink-0 overflow-hidden border-r">
        <div className="h-full overflow-y-auto">
          <div className="space-y-6 p-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="text-primary h-5 w-5" />
                <h1 className="text-xl font-bold">Theme Creator</h1>
              </div>
            </div>

            <Separator />

            {/* Theme Settings */}
            <div className="space-y-4">
              <h3 className="text-foreground font-semibold">Theme Settings</h3>

              {/* Theme Name */}
              <div className="space-y-2">
                <Label htmlFor="theme-name" className="text-sm font-medium">
                  Theme Name
                </Label>
                <Input
                  id="theme-name"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="Enter theme name"
                />
              </div>

              {/* Theme Description */}
              <div className="space-y-2">
                <Label htmlFor="theme-description" className="text-sm font-medium">
                  Theme Description
                </Label>
                <Input
                  id="theme-description"
                  value={themeDescription}
                  onChange={(e) => setThemeDescription(e.target.value)}
                  placeholder="Describe your theme..."
                />
              </div>

              {/* Border Radius Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="radius-slider"
                    className="flex items-center gap-1.5 text-sm font-medium"
                  >
                    <CornerDownRight className="h-4 w-4" />
                    Border Radius
                  </Label>
                  <span className="text-muted-foreground font-mono text-xs">
                    {currentTheme.radius}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    id="radius-slider"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[radiusValue]}
                    onValueChange={(values) => handleRadiusChange(values[0])}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleRadiusChange(0)}
                      title="No radius (square corners)"
                    >
                      <span className="sr-only">Square</span>
                      <div className="h-3 w-3 border border-current" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleRadiusChange(0.5)}
                      title="Medium radius (default)"
                    >
                      <span className="sr-only">Medium radius</span>
                      <div className="h-3 w-3 rounded-md border border-current" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleRadiusChange(1)}
                      title="Large radius"
                    >
                      <span className="sr-only">Large radius</span>
                      <div className="h-3 w-3 rounded-lg border border-current" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleRadiusChange(2)}
                      title="Full radius (pill)"
                    >
                      <span className="sr-only">Pill</span>
                      <div className="h-3 w-3 rounded-full border border-current" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Theme Mode */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Theme Mode</Label>
                <Select
                  value={themeMode}
                  onValueChange={(value: 'light' | 'dark' | 'both') => setThemeMode(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          <Sun className="h-3 w-3" />
                          <Moon className="h-3 w-3" />
                        </div>
                        Both Light & Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-3 w-3" />
                        Light Mode Only
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-3 w-3" />
                        Dark Mode Only
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Public/Private Toggle */}
              <div className="bg-muted flex items-center justify-between rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">Public Theme</span>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>

              {/* Mode Tabs (only show if both modes are enabled) */}
              {themeMode === 'both' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Editing Mode</Label>
                  <div className="bg-muted flex rounded-lg p-1">
                    <button
                      onClick={() => setIsDarkMode(false)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        !isDarkMode
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Sun className="h-4 w-4" />
                      Light
                    </button>
                    <button
                      onClick={() => setIsDarkMode(true)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isDarkMode
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Moon className="h-4 w-4" />
                      Dark
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Color Groups */}
            {colorGroups.map((group) => (
              <div key={group.name} className="space-y-4">
                <h3 className="text-foreground font-semibold">{group.name}</h3>
                <div className="space-y-3">
                  {group.variables.map((variable) => (
                    <ColorInput
                      key={variable}
                      variable={variable}
                      label={variable
                        .split('-')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}
                    />
                  ))}
                </div>
                {group.name !== 'Sidebar' && <Separator />}
              </div>
            ))}

            {/* Export Button */}
            <Button className="w-full" variant="outline" onClick={handleSaveTheme}>
              <SaveIcon className="mr-2 h-4 w-4" />
              Save Theme
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto" style={generateThemeStyles(currentTheme)}>
          <iframe
            ref={iframeRef}
            src="/"
            className="size-full"
            onLoad={handleIframeLoad}
            title="Theme Preview"
          />
        </div>
      </div>

      {/* Custom Color Picker */}
      {activeColorVar && (
        <div
          ref={colorPickerRef}
          className="absolute z-50 rounded-md shadow-xl"
          style={{
            top: `${colorPickerPosition.top}px`,
            left: `${colorPickerPosition.left}px`,
          }}
        >
          <SketchPicker
            color={hslToHex(currentTheme[activeColorVar as keyof typeof currentTheme])}
            onChange={(color) => handleColorChange(color, activeColorVar)}
            disableAlpha={true}
            presetColors={[
              '#D0021B',
              '#F5A623',
              '#F8E71C',
              '#8B572A',
              '#7ED321',
              '#417505',
              '#BD10E0',
              '#9013FE',
              '#4A90E2',
              '#50E3C2',
              '#B8E986',
              '#000000',
              '#4A4A4A',
              '#9B9B9B',
              '#FFFFFF',
              '#328085',
            ]}
          />
        </div>
      )}
    </div>
  );
}

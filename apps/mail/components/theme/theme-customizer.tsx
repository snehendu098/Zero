import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette, Sun, Moon, Download, Globe } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PreviewComponent } from './preview';
import { SketchPicker } from 'react-color';
import type React from 'react';

// Theme variable definitions
const darkTheme = {
  radius: '0.5rem', // Added radius
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

const lightTheme = {
  radius: '0.5rem', // Added radius
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
      'sidebar-foreground',
      'sidebar-primary',
      'sidebar-primary-foreground',
      'sidebar-accent',
      'sidebar-accent-foreground',
      'sidebar-border',
    ],
  },
];

// Convert HSL to hex for color input
function hslToHex(hsl: string): string {
  try {
    const [h, s, l] = hsl.split(' ').map((v) => {
      const num = Number.parseFloat(v.replace('%', ''));
      return isNaN(num) ? 0 : num;
    });

    const hNorm = (((h % 360) + 360) % 360) / 360;
    const sNorm = Math.max(0, Math.min(100, s)) / 100;
    const lNorm = Math.max(0, Math.min(100, l)) / 100;

    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((hNorm * 6) % 2) - 1));
    const m = lNorm - c / 2;

    let r = 0,
      g = 0,
      b = 0;

    if (hNorm >= 0 && hNorm < 1 / 6) {
      r = c;
      g = x;
      b = 0;
    } else if (hNorm >= 1 / 6 && hNorm < 2 / 6) {
      r = x;
      g = c;
      b = 0;
    } else if (hNorm >= 2 / 6 && hNorm < 3 / 6) {
      r = 0;
      g = c;
      b = x;
    } else if (hNorm >= 3 / 6 && hNorm < 4 / 6) {
      r = 0;
      g = x;
      b = c;
    } else if (hNorm >= 4 / 6 && hNorm < 5 / 6) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    const rHex = Math.round(Math.max(0, Math.min(255, (r + m) * 255)))
      .toString(16)
      .padStart(2, '0');
    const gHex = Math.round(Math.max(0, Math.min(255, (g + m) * 255)))
      .toString(16)
      .padStart(2, '0');
    const bHex = Math.round(Math.max(0, Math.min(255, (b + m) * 255)))
      .toString(16)
      .padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  } catch (error) {
    return '#000000';
  }
}

// Convert hex to HSL
function hexToHsl(hex: string): string {
  try {
    const cleanHex = hex.replace('#', '').padEnd(6, '0').slice(0, 6);
    const r = Number.parseInt(cleanHex.slice(0, 2), 16) / 255;
    const g = Number.parseInt(cleanHex.slice(2, 4), 16) / 255;
    const b = Number.parseInt(cleanHex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff !== 0) {
      if (max === r) h = ((g - b) / diff) % 6;
      else if (max === g) h = (b - r) / diff + 2;
      else h = (r - g) / diff + 4;
    }

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const l = (max + min) / 2;
    const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1));

    return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch (error) {
    return '0 0% 0%';
  }
}

const generateThemeStyles = (theme: typeof darkTheme): React.CSSProperties => {
  const styles: Record<string, string> = {};
  Object.entries(theme).forEach(([key, value]) => {
    styles[`--${key}` as any] = value;
  });
  return styles as React.CSSProperties;
};

export default function ThemeCreator() {
  // Theme settings state
  const [themeName, setThemeName] = useState('My Custom Theme');
  const [themeDescription, setThemeDescription] = useState('');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'both'>('both');
  const [isPublic, setIsPublic] = useState(false);

  // Current editing state
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(darkTheme);
  const [activeColorVar, setActiveColorVar] = useState<string | null>(null);
  const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 });
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Switch between light and dark theme editing
  useEffect(() => {
    setCurrentTheme(isDarkMode ? { ...darkTheme } : { ...lightTheme });

    if (themeMode === 'light' && isDarkMode) {
      setIsDarkMode(false);
    } else if (themeMode === 'dark' && !isDarkMode) {
      setIsDarkMode(true);
    }
  }, [isDarkMode, themeMode]);

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
    setCurrentTheme((prev) => ({
      ...prev,
      [variable]: hslValue,
    }));
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
        const colorPickerHeight = 350; // Approximate height of SketchPicker
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Determine if we should position above or below
        const shouldPositionAbove =
          spaceBelow < colorPickerHeight && spaceAbove > colorPickerHeight;

        let top: number;
        let left: number = rect.left + window.scrollX;

        if (shouldPositionAbove) {
          // Position above the element
          top = rect.top + window.scrollY - colorPickerHeight - 5;
        } else {
          // Position below the element (default)
          top = rect.bottom + window.scrollY + 5;
        }

        // Ensure the picker doesn't go off the right edge of the screen
        const colorPickerWidth = 225; // Approximate width of SketchPicker
        const maxLeft = window.innerWidth - colorPickerWidth - 5;
        left = Math.min(left, maxLeft);

        // Ensure the picker doesn't go off the left edge
        left = Math.max(left, 10);

        setColorPickerPosition({ top, left });
      }

      setActiveColorVar(variable);
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
            onChange={(e) => {
              const value = e.target.value.trim();
              setCurrentTheme((prev) => ({ ...prev, [variable]: value }));
            }}
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
            <Button className="w-full" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Save Theme
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto" style={generateThemeStyles(currentTheme)}>
          <PreviewComponent />
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

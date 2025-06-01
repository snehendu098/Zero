import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import React, { useState, useEffect } from 'react';
import { Palette, ArrowLeft } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
// import type { ThemeData } from '@zero/server/lib/schemas';
import { useLocation, useNavigate } from 'react-router';
import type { ThemeData } from '@zero/server/schemas';
import { useThemes } from '@/hooks/use-themes';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

// Your existing color types
type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  ring: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  radius: string;
};

// Your existing default colors
const defaultLightColors: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#f1f5f9',
  accent: '#e2e8f0',
  muted: '#f8fafc',
  background: '#ffffff',
  foreground: '#0f172a',
  card: '#ffffff',
  cardForeground: '#0f172a',
  border: '#e2e8f0',
  ring: '#3b82f6',
  sidebar: '#f8fafc',
  sidebarForeground: '#64748b',
  sidebarAccent: '#f1f5f9',
  sidebarAccentForeground: '#0f172a',
  radius: '0.5rem',
};

const defaultDarkColors: ThemeColors = {
  primary: '#60a5fa',
  secondary: '#1e293b',
  accent: '#334155',
  muted: '#0f172a',
  background: '#020617',
  foreground: '#f8fafc',
  card: '#0f172a',
  cardForeground: '#f8fafc',
  border: '#334155',
  ring: '#60a5fa',
  sidebar: '#0f172a',
  sidebarForeground: '#94a3b8',
  sidebarAccent: '#1e293b',
  sidebarAccentForeground: '#f8fafc',
  radius: '0.5rem',
};

const CreateThemePage = () => {
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [hasDarkMode, setHasDarkMode] = useState(true);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lightColors, setLightColors] = useState<ThemeColors>(defaultLightColors);
  const [darkColors, setDarkColors] = useState<ThemeColors>(defaultDarkColors);
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Get theme hooks
  const { useTheme, createTheme, updateTheme } = useThemes();

  // Get theme ID from URL params
  const editId = new URLSearchParams(location.search).get('edit') as string;
  const isEditing = !!editId && editId !== 'new';

  // Fetch existing theme data if editing
  const { data: existingTheme, isLoading: isLoadingTheme } = useTheme(editId);

  // Load existing theme data when editing
  useEffect(() => {
    if (isEditing && existingTheme?.theme) {
      const theme = existingTheme.theme;
      setThemeName(theme.name);
      setThemeDescription(theme.description || '');
      setIsPublic(theme.isPublic);

      const themeData = theme.themeData as ThemeData;
      setLightColors(themeData.lightColors);
      if (themeData.darkColors) {
        setDarkColors(themeData.darkColors);
        setHasDarkMode(true);
      } else {
        setHasDarkMode(false);
      }
    }
  }, [isEditing, existingTheme]);

  const handleColorChange = (
    variant: 'light' | 'dark',
    colorKey: keyof ThemeColors,
    value: string,
  ) => {
    if (variant === 'light') {
      setLightColors((prev) => ({ ...prev, [colorKey]: value }));
    } else {
      setDarkColors((prev) => ({ ...prev, [colorKey]: value }));
    }
  };

  const getRadiusValue = (variant: 'light' | 'dark'): number => {
    const radiusStr = variant === 'light' ? lightColors.radius : darkColors.radius;
    return Number.parseFloat(radiusStr) || 0.5;
  };

  const handleRadiusChange = (variant: 'light' | 'dark', value: number) => {
    const radiusValue = `${value}rem`;
    if (variant === 'light') {
      setLightColors((prev) => ({ ...prev, radius: radiusValue }));
    } else {
      setDarkColors((prev) => ({ ...prev, radius: radiusValue }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!themeName.trim()) {
      newErrors.themeName = 'Theme name is required';
    } else if (themeName.length < 2) {
      newErrors.themeName = 'Theme name must be at least 2 characters';
    } else if (themeName.length > 100) {
      newErrors.themeName = 'Theme name must be less than 100 characters';
    }

    if (themeDescription && themeDescription.length > 500) {
      newErrors.themeDescription = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const themeData: ThemeData = {
        lightColors,
        darkColors: hasDarkMode ? darkColors : lightColors, // Use light colors as fallback
      };

      const themePayload = {
        name: themeName.trim(),
        description: themeDescription.trim() || undefined,
        themeData,
        isPublic,
      };

      if (isEditing && editId) {
        await updateTheme.mutateAsync({
          id: editId,
          ...themePayload,
        });
        toast.success('Theme updated successfully!');
      } else {
        await createTheme.mutateAsync(themePayload);
        toast.success('Theme created successfully!');
      }

      navigate(-1);
    } catch (error) {
      console.error('Failed to save theme:', error);
      toast.error('Failed to save theme. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Show loading state while fetching existing theme
  if (isEditing && isLoadingTheme) {
    return (
      <div className="container mx-auto flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading theme...</p>
        </div>
      </div>
    );
  }

  const currentPreviewColors = previewMode === 'light' ? lightColors : darkColors;

  const previewStyle = {
    '--preview-primary': currentPreviewColors.primary,
    '--preview-secondary': currentPreviewColors.secondary,
    '--preview-accent': currentPreviewColors.accent,
    '--preview-muted': currentPreviewColors.muted,
    '--preview-background': currentPreviewColors.background,
    '--preview-foreground': currentPreviewColors.foreground,
    '--preview-card': currentPreviewColors.card,
    '--preview-card-foreground': currentPreviewColors.cardForeground,
    '--preview-border': currentPreviewColors.border,
    '--preview-ring': currentPreviewColors.ring,
    '--preview-sidebar': currentPreviewColors.sidebar,
    '--preview-sidebar-foreground': currentPreviewColors.sidebarForeground,
    '--preview-sidebar-accent': currentPreviewColors.sidebarAccent,
    '--preview-sidebar-accent-foreground': currentPreviewColors.sidebarAccentForeground,
    '--preview-radius': currentPreviewColors.radius,
  } as React.CSSProperties;

  return (
    <div className="container mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Themes
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Theme' : 'Create New Theme'}</h1>
          <p className="text-muted-foreground">
            {isEditing
              ? 'Update your existing theme'
              : 'Design a custom theme for your email client'}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-6">
        {/* Configuration Panel */}
        <div className="h-[80vh] w-[45%] overflow-y-auto">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme Information
                </CardTitle>
                <CardDescription>Basic details about your theme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme-name">Theme Name *</Label>
                  <Input
                    id="theme-name"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    placeholder="My Awesome Theme"
                    className={errors.themeName ? 'border-destructive' : ''}
                    maxLength={100}
                  />
                  {errors.themeName && (
                    <p className="text-destructive text-sm">{errors.themeName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme-description">Description</Label>
                  <Textarea
                    id="theme-description"
                    value={themeDescription}
                    onChange={(e) => setThemeDescription(e.target.value)}
                    placeholder="A beautiful theme with vibrant colors..."
                    className={errors.themeDescription ? 'border-destructive' : ''}
                    maxLength={500}
                  />
                  {errors.themeDescription && (
                    <p className="text-destructive text-sm">{errors.themeDescription}</p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {themeDescription.length}/500 characters
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode Support</Label>
                    <p className="text-muted-foreground text-sm">
                      Include a dark variant of your theme
                    </p>
                  </div>
                  <Switch checked={hasDarkMode} onCheckedChange={setHasDarkMode} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Make Public</Label>
                    <p className="text-muted-foreground text-sm">
                      Allow others to discover and copy this theme
                    </p>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isLoading || createTheme.isPending || updateTheme.isPending}
                  className="flex-1"
                >
                  {(isLoading || createTheme.isPending || updateTheme.isPending) && (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  )}
                  {isEditing ? 'Update Theme' : 'Create Theme'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </CardFooter>
            </Card>

            {/* Color Configuration - Your existing color configuration code */}
            <Card>
              <CardHeader>
                <CardTitle>Color Configuration</CardTitle>
                <CardDescription>Customize the colors for your theme</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={previewMode}
                  onValueChange={(value) => setPreviewMode(value as 'light' | 'dark')}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="light">Light Mode</TabsTrigger>
                    <TabsTrigger value="dark" disabled={!hasDarkMode}>
                      Dark Mode
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="light" className="mt-4 space-y-4">
                    {/* Your existing light mode color inputs */}
                    <ColorConfigurationSection
                      colors={lightColors}
                      onChange={(key, value) => handleColorChange('light', key, value)}
                      radiusValue={getRadiusValue('light')}
                      onRadiusChange={(value) => handleRadiusChange('light', value)}
                    />
                  </TabsContent>

                  <TabsContent value="dark" className="mt-4 space-y-4">
                    {/* Your existing dark mode color inputs */}
                    <ColorConfigurationSection
                      colors={darkColors}
                      onChange={(key, value) => handleColorChange('dark', key, value)}
                      radiusValue={getRadiusValue('dark')}
                      onRadiusChange={(value) => handleRadiusChange('dark', value)}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Panel - Your existing preview code */}
        <div className="h-[80vh] w-[45%] overflow-y-auto">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Live Preview
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {previewMode === 'light' ? 'Light Mode' : 'Dark Mode'}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription>
                  See how your theme looks in real-time as you make changes
                </CardDescription>
              </CardHeader>
              <CardContent
                className="space-y-6 rounded-lg p-6 transition-all duration-300"
                style={{
                  ...previewStyle,
                  backgroundColor: currentPreviewColors.background,
                  color: currentPreviewColors.foreground,
                  border: `1px solid ${currentPreviewColors.border}`,
                }}
              >
                {/* Your existing preview content */}
                <ThemePreviewContent colors={currentPreviewColors} />
              </CardContent>
            </Card>

            {/* Tips Card - Your existing tips */}
            <Card>
              <CardHeader>
                <CardTitle>Design Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <p>
                    • <strong>Contrast:</strong> Ensure good contrast between text and background
                    colors for readability.
                  </p>
                  <p>
                    • <strong>Consistency:</strong> Use colors that work well together and maintain
                    visual harmony.
                  </p>
                  <p>
                    • <strong>Accessibility:</strong> Test your theme with different lighting
                    conditions and consider color-blind users.
                  </p>
                  <p>
                    • <strong>Live Preview:</strong> The preview updates in real-time as you change
                    colors.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Extract color configuration into a separate component for cleaner code
const ColorConfigurationSection = ({
  colors,
  onChange,
  radiusValue,
  onRadiusChange,
}: {
  colors: ThemeColors;
  onChange: (key: keyof ThemeColors, value: string) => void;
  radiusValue: number;
  onRadiusChange: (value: number) => void;
}) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium">Main Colors</h3>
        <div className="grid grid-cols-1 gap-4">
          <ColorInput
            label="Primary"
            value={colors.primary}
            onChange={(value) => onChange('primary', value)}
            description="Main brand color for buttons and links"
          />
          <ColorInput
            label="Secondary"
            value={colors.secondary}
            onChange={(value) => onChange('secondary', value)}
            description="Secondary elements and subtle backgrounds"
          />
          <ColorInput
            label="Accent"
            value={colors.accent}
            onChange={(value) => onChange('accent', value)}
            description="Accent color for highlights and emphasis"
          />
          <ColorInput
            label="Muted"
            value={colors.muted}
            onChange={(value) => onChange('muted', value)}
            description="Muted backgrounds and disabled states"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Background & Panel Colors</h3>
        <div className="grid grid-cols-1 gap-4">
          <ColorInput
            label="Background"
            value={colors.background}
            onChange={(value) => onChange('background', value)}
            description="Main background color"
          />

          <ColorInput
            label="Foreground"
            value={colors.foreground}
            onChange={(value) => onChange('foreground', value)}
            description="Main text color"
          />
          <ColorInput
            label="Border"
            value={colors.border}
            onChange={(value) => onChange('border', value)}
            description="Border color for elements"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Sidebar Colors</h3>
        <div className="grid grid-cols-1 gap-4">
          <ColorInput
            label="Sidebar Background"
            value={colors.sidebar}
            onChange={(value) => onChange('sidebar', value)}
            description="Background color for sidebar"
          />
          <ColorInput
            label="Sidebar Foreground"
            value={colors.sidebarForeground}
            onChange={(value) => onChange('sidebarForeground', value)}
            description="Text color for sidebar"
          />
          <ColorInput
            label="Sidebar Accent"
            value={colors.sidebarAccent}
            onChange={(value) => onChange('sidebarAccent', value)}
            description="Accent color for sidebar elements"
          />
          <ColorInput
            label="Sidebar Accent Foreground"
            value={colors.sidebarAccentForeground}
            onChange={(value) => onChange('sidebarAccentForeground', value)}
            description="Text color for sidebar accent elements"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium">Border Radius</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Corner Radius</Label>
              <span className="text-muted-foreground text-sm">{colors.radius}</span>
            </div>
            <Slider
              max={2}
              step={0.1}
              min={0}
              value={[radiusValue]}
              onValueChange={(value) => onRadiusChange(value[0])}
            />
            <p className="text-muted-foreground text-xs">
              Controls the roundness of corners for UI elements
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Extract preview content into a separate component
const ThemePreviewContent = ({ colors }: { colors: ThemeColors }) => {
  return (
    <>
      {/* Layout Preview */}
      <div
        className="flex h-64 overflow-hidden rounded-lg border"
        style={{ borderRadius: colors.radius }}
      >
        {/* Sidebar */}
        <div
          className="flex w-1/4 flex-col p-4"
          style={{
            backgroundColor: colors.sidebar,
            color: colors.sidebarForeground,
            borderRight: `1px solid ${colors.border}`,
          }}
        >
          <h4 className="mb-3 font-medium">Sidebar</h4>
          <div
            className="mb-2 rounded-md px-3 py-2"
            style={{
              backgroundColor: colors.sidebarAccent,
              color: colors.sidebarAccentForeground,
              borderRadius: colors.radius,
            }}
          >
            Active Item
          </div>
          <div className="mb-2 px-3 py-2 opacity-80">Menu Item</div>
          <div className="mb-2 px-3 py-2 opacity-80">Menu Item</div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          <h4 className="mb-3 font-medium">Main Panel</h4>
          <div className="space-y-4">
            {/* Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                className="px-3 py-1.5 text-sm font-medium text-white transition-all duration-300 hover:opacity-90"
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                }}
              >
                Primary
              </button>
              <button
                className="border px-3 py-1.5 text-sm font-medium transition-all duration-300 hover:opacity-90"
                style={{
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderRadius: colors.radius,
                }}
              >
                Secondary
              </button>
            </div>

            {/* Form Elements */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Input field"
                className="w-full border px-3 py-2 text-sm transition-all duration-300"
                style={{
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderRadius: colors.radius,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Your existing color palette preview, sidebar colors preview, and typography preview */}
      {/* ... rest of your preview content ... */}
    </>
  );
};

// Your existing ColorInput component
const ColorInput = ({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className="border-border h-10 w-10 cursor-pointer rounded-md border-2 transition-transform hover:scale-105"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          title={`Pick color for ${label}`}
        />
      </div>
      <div className="flex-1">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="font-mono"
        />
      </div>
    </div>
    {description && <p className="text-muted-foreground text-xs">{description}</p>}
  </div>
);

export default CreateThemePage;

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import React, { useState } from 'react';
import { Palette } from 'lucide-react';

import { getCustomThemes, saveCustomTheme } from '@/lib/themes/theme-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useCurrentTheme } from '../context/theme-context';
import { useLocation, useNavigate } from 'react-router';
import type { CustomTheme, ThemeColors } from '@/types';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';

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
    panel: '#ffffff',
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
    panel: '#020617',
    radius: '0.5rem',
};

const CreateThemePage = () => {
    const [themeName, setThemeName] = useState('');
    const [themeDescription, setThemeDescription] = useState('');
    const [hasDarkMode, setHasDarkMode] = useState(true);
    const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [lightColors, setLightColors] = useState<ThemeColors>(defaultLightColors);
    const [darkColors, setDarkColors] = useState<ThemeColors>(defaultDarkColors);
    const { applyTheme, refreshCustomThemes } = useCurrentTheme();

    const location = useLocation();
    const navigate = useNavigate();

    const editId = new URLSearchParams(location.search).get('editId');

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
        } else if (!/^[a-zA-Z0-9\s-_]+$/.test(themeName)) {
            newErrors.themeName =
                'Theme name can only contain letters, numbers, spaces, hyphens, and underscores';
        }

        if (!themeDescription.trim()) {
            newErrors.themeDescription = 'Theme description is required';
        }

        // Check if theme name already exists (only for new themes)
        if (!editId) {
            const existingThemes = getCustomThemes();
            if (existingThemes.some((theme) => theme.name.toLowerCase() === themeName.toLowerCase())) {
                newErrors.themeName = 'A theme with this name already exists';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) return;

        const customTheme: CustomTheme = {
            id: editId || `custom-${Math.random().toString(36).substr(2, 9)}`,
            name: themeName.trim(),
            description: themeDescription.trim(),
            colors: {
                light: lightColors,
                dark: hasDarkMode ? darkColors : undefined,
            },
            hasDarkMode,
            createdAt: new Date().toISOString(),
        };

        saveCustomTheme(customTheme);
        refreshCustomThemes();

        navigate(-1);
    };

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
        '--preview-panel': currentPreviewColors.panel,
        '--preview-radius': currentPreviewColors.radius,
    } as React.CSSProperties;

    return (
        <div className="container mx-auto flex justify-center gap-4">
            {/* configs */}
            <div className="h-[80vh] w-[40%] overflow-y-auto p-6">
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
                                <Label htmlFor="theme-name">Theme Name</Label>
                                <Input
                                    id="theme-name"
                                    value={themeName}
                                    onChange={(e) => setThemeName(e.target.value)}
                                    placeholder="My Awesome Theme"
                                    className={errors.themeName ? 'border-destructive' : ''}
                                />
                                {errors.themeName && <p className="text-destructive text-sm">{errors.themeName}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="theme-description">Description</Label>
                                <Textarea
                                    id="theme-description"
                                    value={themeDescription}
                                    onChange={(e) => setThemeDescription(e.target.value)}
                                    placeholder="A beautiful theme with vibrant colors..."
                                    className={errors.themeDescription ? 'border-destructive' : ''}
                                />
                                {errors.themeDescription && (
                                    <p className="text-destructive text-sm">{errors.themeDescription}</p>
                                )}
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
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSave}>Save</Button>
                        </CardFooter>
                    </Card>

                    {/* Color Configuration */}
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
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <h3 className="mb-3 text-sm font-medium">Main Colors</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                <ColorInput
                                                    label="Primary"
                                                    value={lightColors.primary}
                                                    onChange={(value) => handleColorChange('light', 'primary', value)}
                                                    description="Main brand color for buttons and links"
                                                />
                                                <ColorInput
                                                    label="Secondary"
                                                    value={lightColors.secondary}
                                                    onChange={(value) => handleColorChange('light', 'secondary', value)}
                                                    description="Secondary elements and subtle backgrounds"
                                                />
                                                <ColorInput
                                                    label="Accent"
                                                    value={lightColors.accent}
                                                    onChange={(value) => handleColorChange('light', 'accent', value)}
                                                    description="Accent color for highlights and emphasis"
                                                />
                                                <ColorInput
                                                    label="Muted"
                                                    value={lightColors.muted}
                                                    onChange={(value) => handleColorChange('light', 'muted', value)}
                                                    description="Muted backgrounds and disabled states"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="mb-3 text-sm font-medium">Background & Panel Colors</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                <ColorInput
                                                    label="Background"
                                                    value={lightColors.background}
                                                    onChange={(value) => handleColorChange('light', 'background', value)}
                                                    description="Panel color"
                                                />

                                                <ColorInput
                                                    label="Foreground"
                                                    value={lightColors.foreground}
                                                    onChange={(value) => handleColorChange('light', 'foreground', value)}
                                                    description="Main text color"
                                                />
                                                <ColorInput
                                                    label="Border"
                                                    value={lightColors.border}
                                                    onChange={(value) => handleColorChange('light', 'border', value)}
                                                    description="Border color for elements"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="mb-3 text-sm font-medium">Sidebar Colors</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                <ColorInput
                                                    label="Sidebar Background"
                                                    value={lightColors.sidebar}
                                                    onChange={(value) => handleColorChange('light', 'sidebar', value)}
                                                    description="Background color for sidebar"
                                                />
                                                <ColorInput
                                                    label="Sidebar Foreground"
                                                    value={lightColors.sidebarForeground}
                                                    onChange={(value) =>
                                                        handleColorChange('light', 'sidebarForeground', value)
                                                    }
                                                    description="Text color for sidebar"
                                                />
                                                <ColorInput
                                                    label="Sidebar Accent"
                                                    value={lightColors.sidebarAccent}
                                                    onChange={(value) => handleColorChange('light', 'sidebarAccent', value)}
                                                    description="Accent color for sidebar elements"
                                                />
                                                <ColorInput
                                                    label="Sidebar Accent Foreground"
                                                    value={lightColors.sidebarAccentForeground}
                                                    onChange={(value) =>
                                                        handleColorChange('light', 'sidebarAccentForeground', value)
                                                    }
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
                                                        <span className="text-muted-foreground text-sm">
                                                            {lightColors.radius}
                                                        </span>
                                                    </div>
                                                    <Slider
                                                        defaultValue={[getRadiusValue('light')]}
                                                        max={2}
                                                        step={0.1}
                                                        min={0}
                                                        value={[getRadiusValue('light')]}
                                                        onValueChange={(value) => handleRadiusChange('light', value[0])}
                                                    />
                                                    <p className="text-muted-foreground text-xs">
                                                        Controls the roundness of corners for UI elements
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="dark" className="mt-4 space-y-4">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <h3 className="mb-3 text-sm font-medium">Main Colors</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                <ColorInput
                                                    label="Primary"
                                                    value={darkColors.primary}
                                                    onChange={(value) => handleColorChange('dark', 'primary', value)}
                                                    description="Main brand color for buttons and links"
                                                />
                                                <ColorInput
                                                    label="Secondary"
                                                    value={darkColors.secondary}
                                                    onChange={(value) => handleColorChange('dark', 'secondary', value)}
                                                    description="Secondary elements and subtle backgrounds"
                                                />
                                                <ColorInput
                                                    label="Accent"
                                                    value={darkColors.accent}
                                                    onChange={(value) => handleColorChange('dark', 'accent', value)}
                                                    description="Accent color for highlights and emphasis"
                                                />
                                                <ColorInput
                                                    label="Muted"
                                                    value={darkColors.muted}
                                                    onChange={(value) => handleColorChange('dark', 'muted', value)}
                                                    description="Muted backgrounds and disabled states"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="mb-3 text-sm font-medium">Background & Panel Colors</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                <ColorInput
                                                    label="Background"
                                                    value={darkColors.background}
                                                    onChange={(value) => handleColorChange('dark', 'background', value)}
                                                    description="Main background color"
                                                />
                                                <ColorInput
                                                    label="Panel"
                                                    value={darkColors.panel}
                                                    onChange={(value) => handleColorChange('dark', 'panel', value)}
                                                    description="Panel background color"
                                                />
                                                <ColorInput
                                                    label="Foreground"
                                                    value={darkColors.foreground}
                                                    onChange={(value) => handleColorChange('dark', 'foreground', value)}
                                                    description="Main text color"
                                                />
                                                <ColorInput
                                                    label="Border"
                                                    value={darkColors.border}
                                                    onChange={(value) => handleColorChange('dark', 'border', value)}
                                                    description="Border color for elements"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="mb-3 text-sm font-medium">Sidebar Colors</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                <ColorInput
                                                    label="Sidebar Background"
                                                    value={darkColors.sidebar}
                                                    onChange={(value) => handleColorChange('dark', 'sidebar', value)}
                                                    description="Background color for sidebar"
                                                />
                                                <ColorInput
                                                    label="Sidebar Foreground"
                                                    value={darkColors.sidebarForeground}
                                                    onChange={(value) =>
                                                        handleColorChange('dark', 'sidebarForeground', value)
                                                    }
                                                    description="Text color for sidebar"
                                                />
                                                <ColorInput
                                                    label="Sidebar Accent"
                                                    value={darkColors.sidebarAccent}
                                                    onChange={(value) => handleColorChange('dark', 'sidebarAccent', value)}
                                                    description="Accent color for sidebar elements"
                                                />
                                                <ColorInput
                                                    label="Sidebar Accent Foreground"
                                                    value={darkColors.sidebarAccentForeground}
                                                    onChange={(value) =>
                                                        handleColorChange('dark', 'sidebarAccentForeground', value)
                                                    }
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
                                                        <span className="text-muted-foreground text-sm">
                                                            {darkColors.radius}
                                                        </span>
                                                    </div>
                                                    <Slider
                                                        defaultValue={[getRadiusValue('dark')]}
                                                        max={2}
                                                        step={0.1}
                                                        min={0}
                                                        value={[getRadiusValue('dark')]}
                                                        onValueChange={(value) => handleRadiusChange('dark', value[0])}
                                                    />
                                                    <p className="text-muted-foreground text-xs">
                                                        Controls the roundness of corners for UI elements
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
            {/* preview */}
            <div className="h-[80vh] w-[40%] overflow-y-auto p-6">
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
                            {/* Layout Preview */}
                            <div
                                className="flex h-64 overflow-hidden rounded-lg border"
                                style={{ borderRadius: currentPreviewColors.radius }}
                            >
                                {/* Sidebar */}
                                <div
                                    className="flex w-1/4 flex-col p-4"
                                    style={{
                                        backgroundColor: currentPreviewColors.sidebar,
                                        color: currentPreviewColors.sidebarForeground,
                                        borderRight: `1px solid ${currentPreviewColors.border}`,
                                    }}
                                >
                                    <h4 className="mb-3 font-medium">Sidebar</h4>
                                    <div
                                        className="mb-2 rounded-md px-3 py-2"
                                        style={{
                                            backgroundColor: currentPreviewColors.sidebarAccent,
                                            color: currentPreviewColors.sidebarAccentForeground,
                                            borderRadius: currentPreviewColors.radius,
                                        }}
                                    >
                                        Active Item
                                    </div>
                                    <div className="mb-2 px-3 py-2 opacity-80">Menu Item</div>
                                    <div className="mb-2 px-3 py-2 opacity-80">Menu Item</div>
                                </div>

                                {/* Main Content */}
                                <div
                                    className="flex-1 p-4"
                                    style={{
                                        backgroundColor: currentPreviewColors.panel,
                                    }}
                                >
                                    <h4 className="mb-3 font-medium">Main Panel</h4>
                                    <div className="space-y-4">
                                        {/* Buttons */}
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                className="px-3 py-1.5 text-sm font-medium text-white transition-all duration-300 hover:opacity-90"
                                                style={{
                                                    backgroundColor: currentPreviewColors.primary,
                                                    borderRadius: currentPreviewColors.radius,
                                                }}
                                            >
                                                Primary
                                            </button>
                                            <button
                                                className="border px-3 py-1.5 text-sm font-medium transition-all duration-300 hover:opacity-90"
                                                style={{
                                                    backgroundColor: currentPreviewColors.secondary,
                                                    borderColor: currentPreviewColors.border,
                                                    color: currentPreviewColors.foreground,
                                                    borderRadius: currentPreviewColors.radius,
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
                                                    backgroundColor: currentPreviewColors.background,
                                                    borderColor: currentPreviewColors.border,
                                                    color: currentPreviewColors.foreground,
                                                    borderRadius: currentPreviewColors.radius,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Color Palette Preview */}
                            <div>
                                <h4
                                    className="mb-3 text-sm font-medium"
                                    style={{ color: currentPreviewColors.foreground }}
                                >
                                    Color Palette
                                </h4>
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    <div className="space-y-1">
                                        <div
                                            className="flex h-12 items-center justify-center text-xs font-medium text-white transition-all duration-300"
                                            style={{
                                                backgroundColor: currentPreviewColors.primary,
                                                borderRadius: currentPreviewColors.radius,
                                            }}
                                        >
                                            Primary
                                        </div>
                                        <p
                                            className="text-center text-xs"
                                            style={{ color: currentPreviewColors.foreground, opacity: 0.7 }}
                                        >
                                            primary
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div
                                            className="flex h-12 items-center justify-center text-xs font-medium transition-all duration-300"
                                            style={{
                                                backgroundColor: currentPreviewColors.secondary,
                                                color: currentPreviewColors.foreground,
                                                borderRadius: currentPreviewColors.radius,
                                            }}
                                        >
                                            Secondary
                                        </div>
                                        <p
                                            className="text-center text-xs"
                                            style={{ color: currentPreviewColors.foreground, opacity: 0.7 }}
                                        >
                                            secondary
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div
                                            className="flex h-12 items-center justify-center text-xs font-medium transition-all duration-300"
                                            style={{
                                                backgroundColor: currentPreviewColors.accent,
                                                color: currentPreviewColors.foreground,
                                                borderRadius: currentPreviewColors.radius,
                                            }}
                                        >
                                            Accent
                                        </div>
                                        <p
                                            className="text-center text-xs"
                                            style={{ color: currentPreviewColors.foreground, opacity: 0.7 }}
                                        >
                                            accent
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div
                                            className="flex h-12 items-center justify-center text-xs font-medium transition-all duration-300"
                                            style={{
                                                backgroundColor: currentPreviewColors.muted,
                                                color: currentPreviewColors.foreground,
                                                borderRadius: currentPreviewColors.radius,
                                            }}
                                        >
                                            Muted
                                        </div>
                                        <p
                                            className="text-center text-xs"
                                            style={{ color: currentPreviewColors.foreground, opacity: 0.7 }}
                                        >
                                            muted
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Colors Preview */}
                            <div>
                                <h4
                                    className="mb-3 text-sm font-medium"
                                    style={{ color: currentPreviewColors.foreground }}
                                >
                                    Sidebar Colors
                                </h4>
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    <div className="space-y-1">
                                        <div
                                            className="flex h-12 items-center justify-center text-xs font-medium transition-all duration-300"
                                            style={{
                                                backgroundColor: currentPreviewColors.sidebar,
                                                color: currentPreviewColors.sidebarForeground,
                                                borderRadius: currentPreviewColors.radius,
                                            }}
                                        >
                                            Sidebar
                                        </div>
                                        <p
                                            className="text-center text-xs"
                                            style={{ color: currentPreviewColors.foreground, opacity: 0.7 }}
                                        >
                                            sidebar
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div
                                            className="flex h-12 items-center justify-center text-xs font-medium transition-all duration-300"
                                            style={{
                                                backgroundColor: currentPreviewColors.sidebarAccent,
                                                color: currentPreviewColors.sidebarAccentForeground,
                                                borderRadius: currentPreviewColors.radius,
                                            }}
                                        >
                                            Sidebar Accent
                                        </div>
                                        <p
                                            className="text-center text-xs"
                                            style={{ color: currentPreviewColors.foreground, opacity: 0.7 }}
                                        >
                                            sidebar-accent
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div
                                            className="flex h-12 items-center justify-center text-xs font-medium transition-all duration-300"
                                            style={{
                                                backgroundColor: currentPreviewColors.background,
                                                color: currentPreviewColors.foreground,
                                                borderRadius: currentPreviewColors.radius,
                                            }}
                                        >
                                            Panel
                                        </div>
                                        <p
                                            className="text-center text-xs"
                                            style={{ color: currentPreviewColors.foreground, opacity: 0.7 }}
                                        >
                                            panel
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div
                                            className="flex h-12 items-center justify-center border text-xs font-medium transition-all duration-300"
                                            style={{
                                                backgroundColor: currentPreviewColors.background,
                                                borderColor: currentPreviewColors.border,
                                                color: currentPreviewColors.foreground,
                                                borderRadius: currentPreviewColors.radius,
                                            }}
                                        >
                                            Border
                                        </div>
                                        <p
                                            className="text-center text-xs"
                                            style={{ color: currentPreviewColors.foreground, opacity: 0.7 }}
                                        >
                                            border
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Typography Preview */}
                            <div>
                                <h4
                                    className="mb-3 text-sm font-medium"
                                    style={{ color: currentPreviewColors.foreground }}
                                >
                                    Typography
                                </h4>
                                <div className="space-y-2">
                                    <h5
                                        className="text-lg font-semibold"
                                        style={{ color: currentPreviewColors.foreground }}
                                    >
                                        Heading Text
                                    </h5>
                                    <p className="text-sm" style={{ color: currentPreviewColors.foreground }}>
                                        This is how regular text will appear with your theme.
                                    </p>
                                    <p
                                        className="text-sm"
                                        style={{ color: currentPreviewColors.foreground, opacity: 0.7 }}
                                    >
                                        This is muted text for less important information.
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        <span
                                            className="px-2 py-1 text-xs"
                                            style={{
                                                backgroundColor: currentPreviewColors.accent,
                                                color: currentPreviewColors.foreground,
                                                borderRadius: currentPreviewColors.radius,
                                            }}
                                        >
                                            Badge
                                        </span>
                                        <span
                                            className="border px-2 py-1 text-xs"
                                            style={{
                                                borderColor: currentPreviewColors.border,
                                                color: currentPreviewColors.foreground,
                                                borderRadius: currentPreviewColors.radius,
                                            }}
                                        >
                                            Outline Badge
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tips Card */}
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
                                    colors. Use "Apply Preview" to test across the entire app.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CreateThemePage;

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

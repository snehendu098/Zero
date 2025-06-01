import type { ThemeName, ThemeOption, ThemeVariant, CustomTheme, ThemeData } from '@/types';
import { useState, createContext, useEffect, useContext, useCallback } from 'react';
import { getCustomThemes } from '@/lib/themes/theme-utils';
import { defaultThemes } from '@/lib/themes';
import type React from 'react';

export const CurrentThemeContext = createContext<{
  mounted: boolean;
  setMounted: (mounted: boolean) => void;
  activeTheme: ThemeOption | null;
  setActiveTheme: (theme: ThemeOption) => void;
  isTransitioning: boolean;
  setIsTransitioning: (isTransitioning: boolean) => void;
  applyTheme: (themeParams: ThemeData, defaultTheme?: (typeof defaultThemes)[0]) => void;
  removeTheme: () => void;
  revertToDefault: (variant?: 'light' | 'dark') => void;
  parseThemeOption: (option: ThemeOption) => { id: ThemeName | 'default'; variant: ThemeVariant };
  // getThemeColors: (themeOption: ThemeOption) => {
  //   primary: string;
  //   secondary: string;
  //   accent: string;
  //   muted: string;
  // };
  customThemes: CustomTheme[];
  refreshCustomThemes: () => void;
}>({
  mounted: false,
  setMounted: () => {},
  activeTheme: null,
  setActiveTheme: () => {},
  isTransitioning: false,
  setIsTransitioning: () => {},
  applyTheme: () => {},
  removeTheme: () => {},
  revertToDefault: () => {},
  parseThemeOption: () => ({ id: 'default', variant: 'light' }),
  // getThemeColors: () => ({
  //   primary: '#000000',
  //   secondary: '#f1f5f9',
  //   accent: '#f1f5f9',
  //   muted: '#f1f5f9',
  // }),
  customThemes: [],
  refreshCustomThemes: () => {},
});

export const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ThemeOption | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);

  // Load custom themes from localStorage with useCallback to prevent infinite loops
  const refreshCustomThemes = useCallback(() => {
    if (typeof window !== 'undefined') {
      const themes = getCustomThemes();
      setCustomThemes(themes);
    }
  }, []);

  // Parse theme option to get name and variant (updated to handle default themes)
  const parseThemeOption = (
    option: ThemeOption,
  ): { id: ThemeName | 'default'; variant: ThemeVariant } => {
    const [id, variant] = option.split('-') as [ThemeName | 'default', ThemeVariant];
    return { id, variant };
  };

  // // Get theme colors dynamically from CSS or defaults
  // const getThemeColors = (themeOption: ThemeOption) => {
  //   const { id, variant } = parseThemeOption(themeOption);

  //   // Default theme colors
  //   if (id === 'default') {
  //     return variant === 'dark'
  //       ? {
  //           primary: '#ffffff',
  //           secondary: '#1e293b',
  //           accent: '#1e293b',
  //           muted: '#1e293b',
  //         }
  //       : {
  //           primary: '#000000',
  //           secondary: '#f1f5f9',
  //           accent: '#f1f5f9',
  //           muted: '#f1f5f9',
  //         };
  //   }

  //   // Check if it's a custom theme
  //   const customTheme = customThemes.find((theme) => theme.id.toLowerCase() === id);
  //   if (customTheme) {
  //     if (variant === 'dark' && customTheme.colors.dark) {
  //       return {
  //         primary: customTheme.colors.dark.primary,
  //         secondary: customTheme.colors.dark.secondary,
  //         accent: customTheme.colors.dark.accent,
  //         muted: customTheme.colors.dark.muted,
  //       };
  //     }
  //     return {
  //       primary: customTheme.colors.light.primary,
  //       secondary: customTheme.colors.light.secondary,
  //       accent: customTheme.colors.light.accent,
  //       muted: customTheme.colors.light.muted,
  //     };
  //   }

  //   // Find theme in API response
  //   const apiTheme = themesApiReponse.find((theme) => theme.id.toLowerCase() === id);
  //   if (apiTheme) {
  //     return variant === 'dark'
  //       ? extractDarkThemeColors(apiTheme.css)
  //       : extractThemeColors(apiTheme.css);
  //   }

  //   // Fallback colors
  //   return {
  //     primary: '#000000',
  //     secondary: '#f1f5f9',
  //     accent: '#f1f5f9',
  //     muted: '#f1f5f9',
  //   };
  // };

  // Revert to default theme
  const revertToDefault = (variant?: 'light' | 'dark') => {
    // Remove any existing custom styles
    const existingStyle = document.getElementById('dynamic-theme-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    console.log(document.documentElement.classList);

    const currentVariant = activeTheme?.includes('dark') ? 'dark' : 'light';
    setActiveTheme(`default-${variant || currentVariant}`);

    localStorage.removeItem('selected-theme');
    localStorage.setItem('default', `default-${variant || currentVariant}`);

    // Apply the default theme
    // applyTheme(defaultTheme);
  };

  // Helper function to convert hex to HSL
  function hexToHsl(hex: string): string {
    // Remove the # if present
    hex = hex.replace(/^#/, '');

    // Parse the hex values
    const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
    const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
    const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

    // Find the min and max values to calculate the lightness
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h = h * 60;
    }

    // Round to 3 decimal places
    h = Math.round(h * 1000) / 1000;
    s = Math.round(s * 1000) / 10; // Convert to percentage
    l = Math.round(l * 1000) / 10; // Convert to percentage

    return `${h} ${s}% ${l}%`;
  }

  const applyTheme = (themeParams: ThemeData) => {
    console.log('APPLY THEME', themeParams);

    if (typeof themeParams === 'string') {
      themeParams = JSON.parse(themeParams) as ThemeData;
    }

    const [id, variant] = [themeParams.id, themeParams.variant];

    console.log('📝 Applying theme:', { id, variant });

    // 1. Remove any existing theme styles
    const existingStyle = document.getElementById('dynamic-theme-style');
    if (existingStyle) {
      console.log('🗑️ Removing existing custom styles');
      existingStyle.remove();
    } else {
      console.log('ℹ️ No existing custom styles found');
    }

    // 2. Setting dark mode or light mode
    if (variant === 'dark') {
      console.log('🌙 Setting dark mode');
      document.documentElement.classList.add('dark');
    } else {
      console.log('☀️ Setting light mode');
      document.documentElement.classList.remove('dark');
    }

    // 3. Create new style element and set styles
    const style = document.createElement('style');
    style.id = 'dynamic-theme-style';
    style.innerHTML = themeParams.css;

    document.head.appendChild(style);
    console.log('✅ Dynamic theme CSS applied');

    // 4. Update state and localStorage
    setActiveTheme(`${id}-${variant}` as ThemeOption);
    localStorage.setItem('selected-theme', JSON.stringify(themeParams));
    localStorage.removeItem('default');
    console.log('💾 Updated active theme and localStorage');
  };

  const removeTheme = () => {
    const existingStyle = document.getElementById('dynamic-theme-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    localStorage.removeItem('selected-theme');
    localStorage.removeItem('selected-theme-style');
    setActiveTheme(null);

    // Reset to default light theme
    document.documentElement.classList.remove('dark');
  };

  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem('selected-theme');

    if (savedTheme) {
      console.log('USE EFFECT', JSON.parse(savedTheme));
      applyTheme(JSON.parse(savedTheme) as ThemeData);
    } else {
      const defaultTheme = localStorage.getItem('default') as ThemeOption | null;

      if (!defaultTheme) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('default', 'default-light');
        setActiveTheme('default-light');
      } else {
        if (defaultTheme.split('-')[1] === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        setActiveTheme(defaultTheme);
      }
    }
    setTimeout(() => {
      document.documentElement.style.transition = '';
    }, 100);
  }, []);

  return (
    <CurrentThemeContext.Provider
      value={{
        mounted,
        setMounted,
        activeTheme,
        setActiveTheme,
        isTransitioning,
        setIsTransitioning,
        applyTheme,
        removeTheme,
        revertToDefault,
        parseThemeOption,
        // getThemeColors,
        customThemes,
        refreshCustomThemes,
      }}
    >
      {children}
    </CurrentThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useCurrentTheme = () => {
  const context = useContext(CurrentThemeContext);
  if (context === undefined) {
    throw new Error('useCurrentTheme must be used within a ThemeContextProvider');
  }
  return context;
};

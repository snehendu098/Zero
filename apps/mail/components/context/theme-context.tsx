import { useState, createContext, useEffect, useContext } from 'react';
import type { ThemeName, ThemeOption, ThemeVariant } from '@/types';
import type { ThemeColorSchema } from '@zero/server/schemas';
import { generateThemeCss } from '@/lib/themes/theme-utils';
import type React from 'react';

export const CurrentThemeContext = createContext<{
  mounted: boolean;
  setMounted: (mounted: boolean) => void;
  activeTheme: ThemeOption | null;
  setActiveTheme: (theme: ThemeOption) => void;
  isTransitioning: boolean;
  setIsTransitioning: (isTransitioning: boolean) => void;
  applyTheme: (themeData: ThemeColorSchema, dark: boolean, id: string) => void;
  removeTheme: () => void;
  revertToDefault: (variant?: 'light' | 'dark') => void;
  parseThemeOption: (option: ThemeOption) => { id: ThemeName | 'default'; variant: ThemeVariant };
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
});

export const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ThemeOption | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Parse theme option to get name and variant (updated to handle default themes)
  const parseThemeOption = (
    option: ThemeOption,
  ): { id: ThemeName | 'default'; variant: ThemeVariant } => {
    const [id, variant] = option.split('-') as [ThemeName | 'default', ThemeVariant];
    return { id, variant };
  };

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

  const applyTheme = (themeData: ThemeColorSchema, dark: boolean, id: string) => {
    console.log('APPLY THEME', themeData);

    if (typeof themeData === 'string') {
      themeData = JSON.parse(themeData) as ThemeColorSchema;
    }

    console.log('📝 Applying theme:');

    // 1. Remove any existing theme styles
    const existingStyle = document.getElementById('dynamic-theme-style');
    if (existingStyle) {
      console.log('🗑️ Removing existing custom styles');
      existingStyle.remove();
    } else {
      console.log('ℹ️ No existing custom styles found');
    }

    // // 2. Setting dark mode or light mode
    if (dark) {
      console.log('🌙 Setting dark mode');
      document.documentElement.classList.add('dark');
    } else {
      console.log('☀️ Setting light mode');
      document.documentElement.classList.remove('dark');
    }

    const themeCss = generateThemeCss(themeData);

    // 3. Create new style element and set styles
    const style = document.createElement('style');
    style.id = 'dynamic-theme-style';
    style.innerHTML = themeCss;

    document.head.appendChild(style);
    console.log('✅ Dynamic theme CSS applied');

    // // 4. Update state and localStorage

    setActiveTheme(`${id}` as ThemeOption);
    localStorage.setItem('theme-css', JSON.stringify(themeData));
    localStorage.setItem('selected-theme', `${id}`);
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
    // 1. for default themes
    const defaultTheme = localStorage.getItem('default') as ThemeOption | null;
    const customTheme = localStorage.getItem('selected-theme') as ThemeName | null;

    if (defaultTheme) {
      if (defaultTheme.split('-')[1] === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      setActiveTheme(defaultTheme);
      // 2. for custom themes
    } else if (customTheme) {
      const themeData = localStorage.getItem('theme-css');
      if (themeData) {
        applyTheme(
          JSON.parse(themeData) as ThemeColorSchema,
          customTheme.includes('dark'),
          customTheme,
        );
      } else {
        revertToDefault();
      }
    } else {
      // No theme set, revert to default light theme
      document.documentElement.classList.remove('dark');
      localStorage.setItem('default', 'default-light');
      setActiveTheme('default-light');
    }
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

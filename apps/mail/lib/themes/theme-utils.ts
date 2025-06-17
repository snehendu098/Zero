import type { ApiThemeResponse, CustomTheme, ThemeColors, ThemeData } from '@/types';
import type { Theme, ThemeColorSchema } from '@zero/server/schemas';

// Light theme values
const defaultLight = {
  radius: '0.5rem',
  background: '0 0% 100%',
  foreground: '240 10% 3.9%',
  card: '0 0% 100%',
  'card-foreground': '240 10% 3.9%',
  popover: '0 0% 100%',
  'popover-foreground': '240 10% 3.9%',
  primary: '240 5.9% 10%',
  'primary-foreground': '0 0% 98%',
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
  ring: '240 10% 3.9%',
  sidebar: '0 0% 98%',
  'sidebar-foreground': '240 5.3% 26.1%',
  'sidebar-primary': '240 5.9% 10%',
  'sidebar-primary-foreground': '0 0% 98%',
  'sidebar-accent': '240 4.8% 95.9%',
  'sidebar-accent-foreground': '240 5.9% 10%',
  'sidebar-border': '220 13% 91%',
  'sidebar-ring': '217.2 91.2% 59.8%',
  'icon-color': 'black',
};

// Dark theme values
const defaultDark = {
  radius: '0.5rem', // Same as light theme
  background: '0, 0%, 10%', // Note: there's a comma instead of space in original
  foreground: '0 0% 98%',
  card: '240 5.9% 10%',
  'card-foreground': '0 0% 98%',
  popover: '240 3.4% 8%',
  'popover-foreground': '0 0% 99%',
  primary: '0 0% 98%',
  'primary-foreground': '240 5.9% 10%',
  secondary: '240 3.7% 15.9%',
  'secondary-foreground': '0 0% 98%',
  muted: '240 3.7% 15.9%',
  'muted-foreground': '240 5% 64.9%',
  accent: '240 3.7% 15.9%',
  'accent-foreground': '0 0% 98%',
  destructive: '0 62.8% 30.6%',
  'destructive-foreground': '0 0% 98%',
  border: '240 3.7% 20%',
  input: '240 3.7% 15.9%',
  ring: '240 4.9% 83.9%',
  sidebar: '240 3.9% 7%',
  'sidebar-foreground': '240 4.8% 96.9%',
  'sidebar-primary': '224.3 76.3% 48%',
  'sidebar-primary-foreground': '0 0% 100%',
  'sidebar-accent': '240 3.7% 15.9%',
  'sidebar-accent-foreground': '240 4.8% 95.9%',
  'sidebar-border': '240 3.7% 15.9%',
  'sidebar-ring': '217.2 91.2% 59.8%',
  'icon-color': 'currentColor',
};

// Utility function to parse CSS variables and extract theme colors
export function extractThemeColors(themeCss: string): ThemeColors {
  const colors: ThemeColors = {
    primary: '#000000',
    secondary: '#666666',
    accent: '#888888',
    muted: '#cccccc',
    background: '#ffffff',
    foreground: '#000000',
    card: '#ffffff',
    cardForeground: '#000000',
    border: '#e5e7eb',
    ring: '#000000',
    sidebar: '#f8fafc',
    sidebarForeground: '#64748b',
    sidebarAccent: '#f1f5f9',
    sidebarAccentForeground: '#0f172a',
    radius: '0.5rem',
  };

  try {
    // Extract :root section for light theme
    const rootMatch = themeCss.match(/:root\s*{([^}]+)}/s);
    if (rootMatch) {
      const rootContent = rootMatch[1];

      // Extract colors (convert HSL to hex)
      const colorMap = {
        primary: /--primary:\s*([^;]+);/,
        secondary: /--secondary:\s*([^;]+);/,
        accent: /--accent:\s*([^;]+);/,
        muted: /--muted:\s*([^;]+);/,
        background: /--background:\s*([^;]+);/,
        foreground: /--foreground:\s*([^;]+);/,
        card: /--card:\s*([^;]+);/,
        cardForeground: /--card-foreground:\s*([^;]+);/,
        border: /--border:\s*([^;]+);/,
        ring: /--ring:\s*([^;]+);/,
        sidebar: /--sidebar:\s*([^;]+);/,
        sidebarForeground: /--sidebar-foreground:\s*([^;]+);/,
        sidebarAccent: /--sidebar-accent:\s*([^;]+);/,
        sidebarAccentForeground: /--sidebar-accent-foreground:\s*([^;]+);/,
      };

      Object.entries(colorMap).forEach(([key, regex]) => {
        const match = rootContent.match(regex);
        if (match) {
          colors[key as keyof ThemeColors] = hslToHex(match[1].trim());
        }
      });

      // Extract radius
      const radiusMatch = rootContent.match(/--radius:\s*([^;]+);/);
      if (radiusMatch) {
        colors.radius = radiusMatch[1].trim();
      }

      // Extract panel color (fallback to background if not found)
      const panelMatch = rootContent.match(/--panel:\s*([^;]+);/);
      if (panelMatch) {
        colors.background = hslToHex(panelMatch[1].trim());
      } else {
        colors.background = colors.background;
      }
    }
  } catch (error) {
    console.warn('Failed to extract theme colors:', error);
  }

  return colors;
}

// HSL to HEX
export function hslToHex(hslString: string): string {
  try {
    // Parse HSL values like "15.111 55.556% 52.353%"
    const values = hslString.split(/\s+/);
    if (values.length !== 3) return '#000000';

    const h = Number.parseFloat(values[0]) || 0;
    const s = (Number.parseFloat(values[1].replace('%', '')) || 0) / 100;
    const l = (Number.parseFloat(values[2].replace('%', '')) || 0) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0,
      g = 0,
      b = 0;

    if (0 <= h && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (60 <= h && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (120 <= h && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (180 <= h && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (240 <= h && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (300 <= h && h < 360) {
      r = c;
      g = 0;
      b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch (error) {
    console.warn('Failed to convert HSL to hex:', error);
    return '#000000';
  }
}

// HEX to HSL
export function hexToHsl(hex: string): string {
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

// Extract dark theme colors
export function extractDarkThemeColors(themeCss: string): ThemeColors {
  const colors: ThemeColors = {
    primary: '#ffffff',
    secondary: '#999999',
    accent: '#bbbbbb',
    muted: '#333333',
    background: '#000000',
    foreground: '#ffffff',
    card: '#111111',
    cardForeground: '#ffffff',
    border: '#333333',
    ring: '#ffffff',
    sidebar: '#0f172a',
    sidebarForeground: '#94a3b8',
    sidebarAccent: '#1e293b',
    sidebarAccentForeground: '#f8fafc',
    radius: '0.5rem',
  };

  try {
    // Extract .dark section for dark theme
    const darkMatch = themeCss.match(/\.dark\s*{([^}]+)}/s);
    if (darkMatch) {
      const darkContent = darkMatch[1];

      // Extract colors (convert HSL to hex)
      const colorMap = {
        primary: /--primary:\s*([^;]+);/,
        secondary: /--secondary:\s*([^;]+);/,
        accent: /--accent:\s*([^;]+);/,
        muted: /--muted:\s*([^;]+);/,
        background: /--background:\s*([^;]+);/,
        foreground: /--foreground:\s*([^;]+);/,
        card: /--card:\s*([^;]+);/,
        cardForeground: /--card-foreground:\s*([^;]+);/,
        border: /--border:\s*([^;]+);/,
        ring: /--ring:\s*([^;]+);/,
        sidebar: /--sidebar:\s*([^;]+);/,
        sidebarForeground: /--sidebar-foreground:\s*([^;]+);/,
        sidebarAccent: /--sidebar-accent:\s*([^;]+);/,
        sidebarAccentForeground: /--sidebar-accent-foreground:\s*([^;]+);/,
      };

      Object.entries(colorMap).forEach(([key, regex]) => {
        const match = darkContent.match(regex);
        if (match) {
          colors[key as keyof ThemeColors] = hslToHex(match[1].trim());
        }
      });

      // Extract radius (usually the same as light mode)
      const radiusMatch = darkContent.match(/--radius:\s*([^;]+);/);
      if (radiusMatch) {
        colors.radius = radiusMatch[1].trim();
      }

      // Extract panel color (fallback to background if not found)
      const panelMatch = darkContent.match(/--panel:\s*([^;]+);/);
      if (panelMatch) {
        colors.background = hslToHex(panelMatch[1].trim());
      } else {
        colors.background = colors.background;
      }
    }
  } catch (error) {
    console.warn('Failed to extract dark theme colors:', error);
  }

  return colors;
}

// Check if theme has dark mode support
export function hasDarkMode(themeCss: string): boolean {
  return /\.dark\s*{/.test(themeCss);
}

export function hasLightMode(themeCss: string): boolean {
  return /:root\s*{/.test(themeCss);
}

// Generate CSS from theme colors
export function generateThemeCss(colors?: ThemeColorSchema): string {
  const lightCss = colors
    ? `
    :root {
      --radius: ${colors.radius || '0.5rem'};
      --background: ${colors.background ? colors.background : defaultLight.background};
      --foreground: ${colors.foreground ? colors.foreground : defaultLight.foreground};
      --card: ${colors.card ? colors.card : defaultLight.card};
      --card-foreground: ${colors['card-foreground'] ? colors['card-foreground'] : defaultLight['card-foreground']};
      --popover: ${colors.background ? colors.background : defaultLight.popover};
      --popover-foreground: ${colors.foreground ? colors.foreground : defaultLight['popover-foreground']};
      --primary: ${colors.primary ? colors.primary : defaultLight.primary};
      --primary-foreground: ${colors['primary-foreground'] ? colors['primary-foreground'] : defaultLight['primary-foreground']};
      --secondary: ${colors.secondary ? colors.secondary : defaultLight.secondary};
      --secondary-foreground: ${colors['secondary-foreground'] ? colors['secondary-foreground'] : defaultLight['secondary-foreground']};
      --muted: ${colors.muted ? colors.muted : defaultLight.muted};
      --muted-foreground: ${colors['muted-foreground'] ? colors['muted-foreground'] : defaultLight['muted-foreground']};
      --accent: ${colors.accent ? colors.accent : defaultLight.accent};
      --accent-foreground: ${colors['accent-foreground'] ? colors['accent-foreground'] : defaultLight['accent-foreground']};
      --destructive: ${colors.destructive ? colors.destructive : '0 84.2% 60.2%'};
      --destructive-foreground: ${colors['destructive-foreground'] ? colors['destructive-foreground'] : '0 0% 98%'};
      --border: ${colors.border ? colors.border : defaultLight.border};
      --input: ${colors.input ? colors.input : defaultLight.input};
      --ring: ${colors.ring ? colors.ring : defaultLight.ring};
      --sidebar: ${colors.sidebar ? colors.sidebar : defaultLight.sidebar};
      --sidebar-foreground: ${colors['sidebar-foreground'] ? colors['sidebar-foreground'] : defaultLight['sidebar-foreground']};
      --sidebar-primary: ${colors['sidebar-primary'] ? colors['sidebar-primary'] : defaultLight['sidebar-primary']};
      --sidebar-primary-foreground: ${colors['primary-foreground'] ? colors['primary-foreground'] : defaultLight['sidebar-primary-foreground']};
      --sidebar-accent: ${colors['sidebar-accent'] ? colors['sidebar-accent'] : defaultLight['sidebar-accent']};
      --sidebar-accent-foreground: ${colors['sidebar-accent-foreground'] ? colors['sidebar-accent-foreground'] : defaultLight['sidebar-accent-foreground']};
      --sidebar-border: ${colors['sidebar-border'] ? colors['sidebar-border'] : defaultLight['sidebar-border']};
      --sidebar-ring: ${colors['sidebar-ring'] ? colors['sidebar-ring'] : defaultLight['sidebar-ring']};
      --icon-color: ${colors['sidebar-foreground'] ? hslToHex(colors['sidebar-foreground']) : 'black'};
      
      --shadow-color: ${colors['shadow-color'] ? colors['shadow-color'] : 'hsl(0 0% 0% / 0.1)'};
      --shadow-2xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
      --shadow-xs: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.05);
      --shadow-sm: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
      --shadow: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 1px 2px -1px rgb(from var(--shadow-color) r g b / 0.1);
      --shadow-md: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 2px 4px -1px rgb(from var(--shadow-color) r g b / 0.1);
      --shadow-lg: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 4px 6px -1px rgb(from var(--shadow-color) r g b / 0.1);
      --shadow-xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1), 0 8px 10px -1px rgb(from var(--shadow-color) r g b / 0.1);
      --shadow-2xl: 0 1px 3px 0px rgb(from var(--shadow-color) r g b / 0.1);
    }
    `
    : '';

  return lightCss;
}

// Helper to invert a color for contrast
function invertColor(hex: string, opacity = 1): string {
  // Remove the # if present
  hex = hex.replace(/^#/, '');

  // Parse the hex values
  const r = Number.parseInt(hex.substring(0, 2), 16);
  const g = Number.parseInt(hex.substring(2, 4), 16);
  const b = Number.parseInt(hex.substring(4, 6), 16);

  // Calculate perceived brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return white or black based on brightness
  if (brightness > 128) {
    return opacity === 1 ? '#000000' : `rgba(0, 0, 0, ${opacity})`;
  }
  return opacity === 1 ? '#ffffff' : `rgba(255, 255, 255, ${opacity})`;
}

// Generate theme data from API response format
export function generateThemeData(apiThemes: ApiThemeResponse[]): ThemeData[] {
  return apiThemes.flatMap((theme) => {
    const supportsLightMode = hasLightMode(theme.css);
    const supportsDarkMode = hasDarkMode(theme.css);

    const themes: ThemeData[] = [];

    if (supportsLightMode) {
      const lightColors = extractThemeColors(theme.css);

      themes.push({
        id: `${theme.id.toLowerCase()}-light`,
        name: theme.name.toLowerCase(),
        variant: 'light',
        description: theme.description,
        colors: lightColors,
        css: theme.css,
        themeId: theme.id,
      });
    }

    if (supportsDarkMode) {
      const darkColors = extractDarkThemeColors(theme.css);
      themes.push({
        id: `${theme.id.toLowerCase()}-dark`,
        name: theme.name.toLowerCase(),
        variant: 'dark',
        description: theme.description,
        colors: darkColors,
        css: theme.css,
        themeId: theme.id,
      });
    }

    return themes;
  });
}

// Generate theme data from custom themes
export function generateCustomThemeData(customThemes: CustomTheme[]): ThemeData[] {
  return customThemes.flatMap((theme) => {
    const themes: ThemeData[] = [
      {
        id: `${theme.name.toLowerCase()}-light`,
        name: theme.name.toLowerCase(),
        variant: 'light',
        description: theme.description,
        colors: theme.colors.light,
        css: generateThemeCss(theme.colors.light),
        themeId: theme.id,
        isCustom: true,
      },
    ];

    // Only add dark variant if theme has dark mode
    if (theme.hasDarkMode && theme.colors.dark) {
      themes.push({
        id: `${theme.name.toLowerCase()}-dark`,
        name: theme.name.toLowerCase(),
        variant: 'dark',
        description: theme.description,
        colors: theme.colors.dark,
        css: generateThemeCss(theme.colors.dark),
        themeId: theme.id,
        isCustom: true,
      });
    }

    return themes;
  });
}

// Save custom theme to localStorage
export function saveCustomTheme(theme: CustomTheme): void {
  const existingThemes = getCustomThemes();

  // Check if theme with same name exists
  const existingIndex = existingThemes.findIndex(
    (t) => t.name.toLowerCase() === theme.name.toLowerCase(),
  );

  if (existingIndex >= 0) {
    // Update existing theme
    existingThemes[existingIndex] = theme;
  } else {
    // Add new theme
    existingThemes.push(theme);
  }

  localStorage.setItem('custom-themes', JSON.stringify(existingThemes));
}

// Get all custom themes from localStorage
export function getCustomThemes(): CustomTheme[] {
  const themes = localStorage.getItem('custom-themes');
  return themes ? JSON.parse(themes) : [];
}

// Delete custom theme from localStorage
export function deleteCustomTheme(themeId: string): void {
  const existingThemes = getCustomThemes();
  const updatedThemes = existingThemes.filter((theme) => theme.id !== themeId);
  localStorage.setItem('custom-themes', JSON.stringify(updatedThemes));
}

export function parseTheme({ themes }: { themes: Theme[] }): ThemeData[] {
  const apiResponse: ApiThemeResponse[] = themes.map((item) => {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      css: generateThemeCss(item.themeData?.rootColors),
    };
  });

  return generateThemeData(apiResponse);
}

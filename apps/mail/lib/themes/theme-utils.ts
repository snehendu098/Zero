import type { ApiThemeResponse, ThemeData } from "@/types"

// Utility function to parse CSS variables and extract theme colors
export function extractThemeColors(themeCss: string) {
  const colors = {
    primary: "#000000",
    secondary: "#666666",
    accent: "#888888",
    muted: "#cccccc",
  }

  try {
    // Extract :root section for light theme
    const rootMatch = themeCss.match(/:root\s*{([^}]+)}/s)
    if (rootMatch) {
      const rootContent = rootMatch[1]

      // Extract primary color (convert HSL to hex)
      const primaryMatch = rootContent.match(/--primary:\s*([^;]+);/)
      if (primaryMatch) {
        colors.primary = hslToHex(primaryMatch[1].trim())
      }

      // Extract secondary color
      const secondaryMatch = rootContent.match(/--secondary:\s*([^;]+);/)
      if (secondaryMatch) {
        colors.secondary = hslToHex(secondaryMatch[1].trim())
      }

      // Extract accent color
      const accentMatch = rootContent.match(/--accent:\s*([^;]+);/)
      if (accentMatch) {
        colors.accent = hslToHex(accentMatch[1].trim())
      }

      // Extract muted color
      const mutedMatch = rootContent.match(/--muted:\s*([^;]+);/)
      if (mutedMatch) {
        colors.muted = hslToHex(mutedMatch[1].trim())
      }
    }
  } catch (error) {
    console.warn("Failed to extract theme colors:", error)
  }

  return colors
}

// Convert HSL string to hex color
function hslToHex(hslString: string): string {
  try {
    // Parse HSL values like "15.111 55.556% 52.353%"
    const values = hslString.split(/\s+/)
    if (values.length !== 3) return "#000000"

    const h = Number.parseFloat(values[0]) || 0
    const s = (Number.parseFloat(values[1].replace("%", "")) || 0) / 100
    const l = (Number.parseFloat(values[2].replace("%", "")) || 0) / 100

    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2

    let r = 0,
      g = 0,
      b = 0

    if (0 <= h && h < 60) {
      r = c
      g = x
      b = 0
    } else if (60 <= h && h < 120) {
      r = x
      g = c
      b = 0
    } else if (120 <= h && h < 180) {
      r = 0
      g = c
      b = x
    } else if (180 <= h && h < 240) {
      r = 0
      g = x
      b = c
    } else if (240 <= h && h < 300) {
      r = x
      g = 0
      b = c
    } else if (300 <= h && h < 360) {
      r = c
      g = 0
      b = x
    }

    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)

    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
  } catch (error) {
    console.warn("Failed to convert HSL to hex:", error)
    return "#000000"
  }
}

// Extract dark theme colors
export function extractDarkThemeColors(themeCss: string) {
  const colors = {
    primary: "#ffffff",
    secondary: "#999999",
    accent: "#bbbbbb",
    muted: "#333333",
  }

  try {
    // Extract .dark section for dark theme
    const darkMatch = themeCss.match(/\.dark\s*{([^}]+)}/s)
    if (darkMatch) {
      const darkContent = darkMatch[1]

      // Extract primary color (convert HSL to hex)
      const primaryMatch = darkContent.match(/--primary:\s*([^;]+);/)
      if (primaryMatch) {
        colors.primary = hslToHex(primaryMatch[1].trim())
      }

      // Extract secondary color
      const secondaryMatch = darkContent.match(/--secondary:\s*([^;]+);/)
      if (secondaryMatch) {
        colors.secondary = hslToHex(secondaryMatch[1].trim())
      }

      // Extract accent color
      const accentMatch = darkContent.match(/--accent:\s*([^;]+);/)
      if (accentMatch) {
        colors.accent = hslToHex(accentMatch[1].trim())
      }

      // Extract muted color
      const mutedMatch = darkContent.match(/--muted:\s*([^;]+);/)
      if (mutedMatch) {
        colors.muted = hslToHex(mutedMatch[1].trim())
      }
    }
  } catch (error) {
    console.warn("Failed to extract dark theme colors:", error)
  }

  return colors
}

// Check if theme has dark mode support
export function hasDarkMode(themeCss: string): boolean {
  return /\.dark\s*{/.test(themeCss)
}

// Generate theme data from API response format
export function generateThemeData(apiThemes: ApiThemeResponse[]): ThemeData[] {
  return apiThemes.flatMap((theme) => {
    const lightColors = extractThemeColors(theme.css)
    const supportsDarkMode = hasDarkMode(theme.css)

    const themes: ThemeData[] = [
      {
        id: `${theme.name.toLowerCase()}-light`,
        name: theme.name.toLowerCase(),
        variant: "light",
        description: theme.desctiption, // keeping the typo from API
        colors: lightColors,
        css: theme.css,
        themeId: theme.id,
      },
    ]

    // Only add dark variant if theme supports it
    if (supportsDarkMode) {
      const darkColors = extractDarkThemeColors(theme.css)
      themes.push({
        id: `${theme.name.toLowerCase()}-dark`,
        name: theme.name.toLowerCase(),
        variant: "dark",
        description: theme.desctiption,
        colors: darkColors,
        css: theme.css,
        themeId: theme.id,
      })
    }

    return themes
  })
}

// Get available theme options for a given API response
export function getAvailableThemeOptions(apiThemes: ApiThemeResponse[]): string[] {
  const options: string[] = ["default-light", "default-dark"]

  apiThemes.forEach((theme) => {
    const themeName = theme.name.toLowerCase()
    options.push(`${themeName}-light`)

    if (hasDarkMode(theme.css)) {
      options.push(`${themeName}-dark`)
    }
  })

  return options
}

"use client"

import type React from "react"
import { themesApiReponse } from "@/lib/themes"
import { extractThemeColors, extractDarkThemeColors, getCustomThemes, generateThemeCss } from "@/lib/themes/theme-utils"
import type { ThemeName, ThemeOption, ThemeVariant, CustomTheme } from "@/types"
import { useTheme as useNextTheme } from "next-themes"
import { useState, createContext, useEffect, useContext, useCallback } from "react"

export const CurrentThemeContext = createContext<{
    mounted: boolean
    setMounted: (mounted: boolean) => void
    activeTheme: ThemeOption | null
    setActiveTheme: (theme: ThemeOption) => void
    isTransitioning: boolean
    setIsTransitioning: (isTransitioning: boolean) => void
    applyTheme: (themeOption: ThemeOption, themeStyle?: string) => void
    removeTheme: () => void
    revertToDefault: () => void
    parseThemeOption: (option: ThemeOption) => { name: ThemeName | "default"; variant: ThemeVariant }
    getThemeColors: (themeOption: ThemeOption) => { primary: string; secondary: string; accent: string; muted: string }
    customThemes: CustomTheme[]
    refreshCustomThemes: () => void
}>({
    mounted: false,
    setMounted: () => { },
    activeTheme: null,
    setActiveTheme: () => { },
    isTransitioning: false,
    setIsTransitioning: () => { },
    applyTheme: () => { },
    removeTheme: () => { },
    revertToDefault: () => { },
    parseThemeOption: () => ({ name: "default", variant: "light" }),
    getThemeColors: () => ({ primary: "#000000", secondary: "#f1f5f9", accent: "#f1f5f9", muted: "#f1f5f9" }),
    customThemes: [],
    refreshCustomThemes: () => { },
})

export const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false)
    const [activeTheme, setActiveTheme] = useState<ThemeOption | null>(null)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [customThemes, setCustomThemes] = useState<CustomTheme[]>([])
    const { setTheme } = useNextTheme()

    // Load custom themes from localStorage with useCallback to prevent infinite loops
    const refreshCustomThemes = useCallback(() => {
        if (typeof window !== "undefined") {
            const themes = getCustomThemes()
            setCustomThemes(themes)
        }
    }, [])

    // Parse theme option to get name and variant (updated to handle default themes)
    const parseThemeOption = (option: ThemeOption): { name: ThemeName | "default"; variant: ThemeVariant } => {
        const [name, variant] = option.split("-") as [ThemeName | "default", ThemeVariant]
        return { name, variant }
    }

    // Get theme colors dynamically from CSS or defaults
    const getThemeColors = (themeOption: ThemeOption) => {
        const { name, variant } = parseThemeOption(themeOption)

        // Default theme colors
        if (name === "default") {
            return variant === "dark"
                ? {
                    primary: "#ffffff",
                    secondary: "#1e293b",
                    accent: "#1e293b",
                    muted: "#1e293b",
                }
                : {
                    primary: "#000000",
                    secondary: "#f1f5f9",
                    accent: "#f1f5f9",
                    muted: "#f1f5f9",
                }
        }

        // Check if it's a custom theme
        const customTheme = customThemes.find((theme) => theme.name.toLowerCase() === name)
        if (customTheme) {
            if (variant === "dark" && customTheme.colors.dark) {
                return {
                    primary: customTheme.colors.dark.primary,
                    secondary: customTheme.colors.dark.secondary,
                    accent: customTheme.colors.dark.accent,
                    muted: customTheme.colors.dark.muted,
                }
            }
            return {
                primary: customTheme.colors.light.primary,
                secondary: customTheme.colors.light.secondary,
                accent: customTheme.colors.light.accent,
                muted: customTheme.colors.light.muted,
            }
        }

        // Find theme in API response
        const apiTheme = themesApiReponse.find((theme) => theme.name.toLowerCase() === name)
        if (apiTheme) {
            return variant === "dark" ? extractDarkThemeColors(apiTheme.css) : extractThemeColors(apiTheme.css)
        }

        // Fallback colors
        return {
            primary: "#000000",
            secondary: "#f1f5f9",
            accent: "#f1f5f9",
            muted: "#f1f5f9",
        }
    }

    // Revert to default theme
    const revertToDefault = () => {
        const currentVariant = activeTheme?.includes("dark") ? "dark" : "light"
        applyTheme(`default-${currentVariant}` as ThemeOption)
    }

    // Apply the selected theme with smooth transitions (updated to handle default themes)
    const applyTheme = (themeOption: ThemeOption, themeStyle?: string) => {
        if (isTransitioning) return

        // If clicking on already selected theme and it's not default, revert to default
        if (themeOption === activeTheme && !themeOption.startsWith("default")) {
            const currentVariant = activeTheme.includes("dark") ? "dark" : "light"
            themeOption = `default-${currentVariant}` as ThemeOption
        }

        setIsTransitioning(true)
        const { name, variant } = parseThemeOption(themeOption)

        // Add transition class to body
        document.documentElement.classList.add("theme-transition")

        // Small delay to ensure transition class is applied
        requestAnimationFrame(() => {
            // Remove any existing theme styles
            const existingStyle = document.getElementById("dynamic-theme-style")
            if (existingStyle) {
                existingStyle.remove()
            }

            // Apply theme styles (only if not default)
            if (name !== "default") {
                // Check if it's a custom theme
                const customTheme = customThemes.find((theme) => theme.name.toLowerCase() === name)

                if (customTheme) {
                    const style = document.createElement("style")
                    style.id = "dynamic-theme-style"

                    // Use the stored CSS or generate it
                    if (themeStyle) {
                        style.innerHTML = themeStyle
                    } else {
                        // Generate CSS from custom theme colors
                        const lightColors = customTheme.colors.light
                        const darkColors = customTheme.hasDarkMode ? customTheme.colors.dark : undefined
                        // manipulating css line
                        style.innerHTML = generateThemeCss(lightColors, darkColors)
                    }

                    document.head.appendChild(style)
                } else {
                    // It's an API theme
                    const apiTheme = themesApiReponse.find((theme) => theme.name.toLowerCase() === name)
                    if (apiTheme) {
                        const style = document.createElement("style")
                        style.id = "dynamic-theme-style"
                        // manipulating css line
                        style.innerHTML = themeStyle || apiTheme.css
                        document.head.appendChild(style)
                    }
                }
            } else {
                const style = document.createElement("style")
                style.innerHTML = `
  :root {
    --font-geist-sans: 'Geist Variable', sans-serif;
    --font-geist-mono: 'Geist Mono Variable', monospace;
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 10% 3.9%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
    --icon-color: black;
  }

  .dark {
    --background: 0, 0%, 10%;
    --foreground: 0 0% 98%;
    --card: 240 5.9% 10%;
    --card-foreground: 0 0% 98%;
    --popover: 240 3.4% 8%;
    --popover-foreground: 0 0% 99%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 20%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 3.9% 7%;
    --sidebar-foreground: 240 4.8% 96.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
    --icon-color: currentColor;
  }
                `
                document.head.appendChild(style)
            }

            // Set dark mode based on variant
            if (variant === "dark") {
                document.documentElement.classList.add("dark")
                setTheme("dark")
            } else {
                document.documentElement.classList.remove("dark")
                setTheme("light")
            }

            setActiveTheme(themeOption)
            localStorage.setItem("selected-theme", themeOption)

            // Only store theme style if it's not a default theme
            if (name !== "default") {
                // Check if it's a custom theme
                const customTheme = customThemes.find((theme) => theme.name.toLowerCase() === name)

                if (customTheme) {
                    // For custom themes, we don't need to store the CSS as we can regenerate it
                    localStorage.removeItem("selected-theme-style")
                } else {
                    // For API themes, store the CSS
                    const apiTheme = themesApiReponse.find((theme) => theme.name.toLowerCase() === name)
                    if (apiTheme) {
                        if (!themeStyle) {
                            localStorage.setItem("selected-theme-style", apiTheme.css)
                        } else {
                            localStorage.setItem("selected-theme-style", themeStyle)
                        }
                    }
                }
            } else {
                localStorage.removeItem("selected-theme-style")
            }

            // Remove transition class after animation completes
            setTimeout(() => {
                document.documentElement.classList.remove("theme-transition")
                setIsTransitioning(false)
            }, 300)
        })
    }

    const removeTheme = () => {
        const existingStyle = document.getElementById("dynamic-theme-style")
        if (existingStyle) {
            existingStyle.remove()
        }

        localStorage.removeItem("selected-theme")
        localStorage.removeItem("selected-theme-style")
        setActiveTheme(null)

        // Reset to default light theme
        document.documentElement.classList.remove("dark")
        setTheme("light")
    }

    // Helper function to convert hex to HSL
    function hexToHsl(hex: string): string {
        // Remove the # if present
        hex = hex.replace(/^#/, "")

        // Parse the hex values
        const r = Number.parseInt(hex.substring(0, 2), 16) / 255
        const g = Number.parseInt(hex.substring(2, 4), 16) / 255
        const b = Number.parseInt(hex.substring(4, 6), 16) / 255

        // Find the min and max values to calculate the lightness
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        let h = 0
        let s = 0
        let l = (max + min) / 2

        if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0)
                    break
                case g:
                    h = (b - r) / d + 2
                    break
                case b:
                    h = (r - g) / d + 4
                    break
            }
            h = h * 60
        }

        // Round to 3 decimal places
        h = Math.round(h * 1000) / 1000
        s = Math.round(s * 1000) / 10 // Convert to percentage
        l = Math.round(l * 1000) / 10 // Convert to percentage

        return `${h} ${s}% ${l}%`
    }

    useEffect(() => {
        setMounted(true)
        refreshCustomThemes()

        // Prevent transitions on initial load
        document.documentElement.style.transition = "none"

        const savedTheme = localStorage.getItem("selected-theme") as ThemeOption | null
        const savedThemeStyle = localStorage.getItem("selected-theme-style") || ""

        if (savedTheme) {
            const { name, variant } = parseThemeOption(savedTheme)

            // Set initial dark mode class directly
            if (variant === "dark") {
                document.documentElement.classList.add("dark")
                setTheme("dark")
            } else {
                document.documentElement.classList.remove("dark")
                setTheme("light")
            }

            // Apply theme without transitions (only if not default)
            if (name !== "default") {
                // Check if it's a custom theme
                const customTheme = getCustomThemes().find((theme) => theme.name.toLowerCase() === name)

                if (customTheme) {
                    const style = document.createElement("style")
                    style.id = "dynamic-theme-style"

                    // Generate CSS from custom theme colors
                    const lightColors = customTheme.colors.light
                    const darkColors = customTheme.hasDarkMode ? customTheme.colors.dark : undefined

                    style.innerHTML = `
:root {
  --radius: 0.5rem;
  --background: ${lightColors.background ? hexToHsl(lightColors.background) : "0 0% 100%"};
  --foreground: ${lightColors.foreground ? hexToHsl(lightColors.foreground) : "0 0% 3.9%"};
  --card: ${lightColors.card ? hexToHsl(lightColors.card) : "0 0% 100%"};
  --card-foreground: ${lightColors.cardForeground ? hexToHsl(lightColors.cardForeground) : "0 0% 3.9%"};
  --popover: ${lightColors.background ? hexToHsl(lightColors.background) : "0 0% 100%"};
  --popover-foreground: ${lightColors.foreground ? hexToHsl(lightColors.foreground) : "0 0% 3.9%"};
  --primary: ${hexToHsl(lightColors.primary)};
  --primary-foreground: 0 0% 98%;
  --secondary: ${hexToHsl(lightColors.secondary)};
  --secondary-foreground: 0 0% 9%;
  --muted: ${hexToHsl(lightColors.muted)};
  --muted-foreground: 0 0% 45.1%;
  --accent: ${hexToHsl(lightColors.accent)};
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: ${lightColors.border ? hexToHsl(lightColors.border) : "0 0% 89.8%"};
  --input: ${lightColors.border ? hexToHsl(lightColors.border) : "0 0% 89.8%"};
  --ring: ${lightColors.ring ? hexToHsl(lightColors.ring) : "0 0% 3.9%"};
}
${darkColors
                            ? `
.dark {
  --background: ${darkColors.background ? hexToHsl(darkColors.background) : "0 0% 3.9%"};
  --foreground: ${darkColors.foreground ? hexToHsl(darkColors.foreground) : "0 0% 98%"};
  --card: ${darkColors.card ? hexToHsl(darkColors.card) : "0 0% 3.9%"};
  --card-foreground: ${darkColors.cardForeground ? hexToHsl(darkColors.cardForeground) : "0 0% 98%"};
  --popover: ${darkColors.background ? hexToHsl(darkColors.background) : "0 0% 3.9%"};
  --popover-foreground: ${darkColors.foreground ? hexToHsl(darkColors.foreground) : "0 0% 98%"};
  --primary: ${hexToHsl(darkColors.primary)};
  --primary-foreground: 0 0% 9%;
  --secondary: ${hexToHsl(darkColors.secondary)};
  --secondary-foreground: 0 0% 98%;
  --muted: ${hexToHsl(darkColors.muted)};
  --muted-foreground: 0 0% 63.9%;
  --accent: ${hexToHsl(darkColors.accent)};
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: ${darkColors.border ? hexToHsl(darkColors.border) : "0 0% 14.9%"};
  --input: ${darkColors.border ? hexToHsl(darkColors.border) : "0 0% 14.9%"};
  --ring: ${darkColors.ring ? hexToHsl(darkColors.ring) : "0 0% 83.1%"};
}`
                            : ""
                        }
          `

                    document.head.appendChild(style)
                } else {
                    // It's an API theme
                    const apiTheme = themesApiReponse.find((theme) => theme.name.toLowerCase() === name)
                    if (apiTheme) {
                        const style = document.createElement("style")
                        style.id = "dynamic-theme-style"
                        style.innerHTML = savedThemeStyle || apiTheme.css
                        document.head.appendChild(style)
                    }
                }
            }

            setActiveTheme(savedTheme)
        } else {
            // Default to light mode with no custom theme
            document.documentElement.classList.remove("dark")
            setTheme("light")
            setActiveTheme("default-light")
        }

        // Re-enable transitions after initial load
        setTimeout(() => {
            document.documentElement.style.transition = ""
        }, 100)
    }, [setTheme, refreshCustomThemes])

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
                getThemeColors,
                customThemes,
                refreshCustomThemes,
            }}
        >
            {children}
        </CurrentThemeContext.Provider>
    )
}

// Custom hook to use the theme context
export const useCurrentTheme = () => {
    const context = useContext(CurrentThemeContext)
    if (context === undefined) {
        throw new Error("useCurrentTheme must be used within a ThemeContextProvider")
    }
    return context
}

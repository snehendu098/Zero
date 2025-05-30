"use client"

import type React from "react"
import { themesApiReponse } from "@/lib/themes"
import { extractThemeColors, extractDarkThemeColors, getCustomThemes, generateThemeCss } from "@/lib/themes/theme-utils"
import type { ThemeName, ThemeOption, ThemeVariant, CustomTheme } from "@/types"
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
        const defaultTheme = `default-${currentVariant}` as ThemeOption

        // Remove any existing custom styles
        const existingStyle = document.getElementById("dynamic-theme-style")
        if (existingStyle) {
            existingStyle.remove()
        }

        // Apply the default theme
        applyTheme(defaultTheme)
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

    // Apply the selected theme with smooth transitions (FIXED VERSION)
    const applyTheme = (themeOption: ThemeOption, themeStyle?: string) => {
        console.log('🎨 applyTheme called with:', themeOption, 'current active:', activeTheme)

        if (isTransitioning) {
            console.log('❌ Transition in progress, skipping')
            return
        }

        setIsTransitioning(true)
        const { name, variant } = parseThemeOption(themeOption)
        console.log('📝 Parsed theme:', { name, variant })

        // Add transition class to body
        document.documentElement.classList.add("theme-transition")

        // Small delay to ensure transition class is applied
        requestAnimationFrame(() => {
            console.log('🔄 Applying theme changes...')

            // ALWAYS remove any existing theme styles first
            const existingStyle = document.getElementById("dynamic-theme-style")
            if (existingStyle) {
                console.log('🗑️ Removing existing custom styles')
                existingStyle.remove()
            } else {
                console.log('ℹ️ No existing custom styles found')
            }

            // Set dark mode based on variant - do this IMMEDIATELY
            if (variant === "dark") {
                console.log('🌙 Setting dark mode')
                document.documentElement.classList.add("dark")
            } else {
                console.log('☀️ Setting light mode')
                document.documentElement.classList.remove("dark")
            }

            // Apply custom theme styles ONLY if not default
            if (name !== "default") {
                console.log('🎨 Applying custom theme for:', name)
                const customTheme = customThemes.find((theme) => theme.name.toLowerCase() === name)

                if (customTheme) {
                    console.log('✅ Found custom theme, generating CSS')
                    const style = document.createElement("style")
                    style.id = "dynamic-theme-style"

                    if (themeStyle) {
                        style.innerHTML = themeStyle
                    } else {
                        const lightColors = customTheme.colors.light
                        const darkColors = customTheme.hasDarkMode ? customTheme.colors.dark : undefined
                        style.innerHTML = generateThemeCss(lightColors, darkColors)
                    }

                    document.head.appendChild(style)
                    console.log('✅ Custom theme CSS applied')
                } else {
                    // It's an API theme
                    console.log('🔍 Looking for API theme:', name)
                    const apiTheme = themesApiReponse.find((theme) => theme.name.toLowerCase() === name)
                    if (apiTheme) {
                        console.log('✅ Found API theme, applying CSS')
                        const style = document.createElement("style")
                        style.id = "dynamic-theme-style"
                        style.innerHTML = themeStyle || apiTheme.css
                        document.head.appendChild(style)
                        console.log('✅ API theme CSS applied')
                    } else {
                        console.log('❌ API theme not found')
                    }
                }
            } else {
                console.log('ℹ️ Default theme - no custom CSS needed')
            }

            // Update state and localStorage
            console.log('💾 Updating state and localStorage')
            setActiveTheme(themeOption)
            localStorage.setItem("selected-theme", themeOption)

            // Handle localStorage for theme styles
            if (name !== "default") {
                const customTheme = customThemes.find((theme) => theme.name.toLowerCase() === name)
                if (customTheme) {
                    localStorage.removeItem("selected-theme-style")
                } else {
                    const apiTheme = themesApiReponse.find((theme) => theme.name.toLowerCase() === name)
                    if (apiTheme && !themeStyle) {
                        localStorage.setItem("selected-theme-style", apiTheme.css)
                    } else if (themeStyle) {
                        localStorage.setItem("selected-theme-style", themeStyle)
                    }
                }
            } else {
                localStorage.removeItem("selected-theme-style")
            }

            // Remove transition class after animation completes
            setTimeout(() => {
                document.documentElement.classList.remove("theme-transition")
                setIsTransitioning(false)
                console.log('✅ Theme transition completed')
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
            } else {
                document.documentElement.classList.remove("dark")
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

                    style.innerHTML = generateThemeCss(lightColors, darkColors)
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
            setActiveTheme("default-light")
        }

        // Re-enable transitions after initial load
        setTimeout(() => {
            document.documentElement.style.transition = ""
        }, 100)
    }, [refreshCustomThemes])

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
"use client"

import type React from "react"
import { themesApiReponse } from "@/lib/themes"
import { extractThemeColors, extractDarkThemeColors } from "@/lib/themes/theme-utils"
import type { ThemeName, ThemeOption, ThemeVariant } from "@/types"
import { useTheme as useNextTheme } from "next-themes"
import { useState, createContext, useEffect, useContext } from "react"

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
})

export const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false)
    const [activeTheme, setActiveTheme] = useState<ThemeOption | null>(null)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const { setTheme } = useNextTheme()

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
                const apiTheme = themesApiReponse.find((theme) => theme.name.toLowerCase() === name)
                if (apiTheme) {
                    const style = document.createElement("style")
                    style.id = "dynamic-theme-style"
                    style.innerHTML = themeStyle || apiTheme.css
                    document.head.appendChild(style)
                }
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
            const apiTheme = themesApiReponse.find((theme) => theme.name.toLowerCase() === name)
            if (name !== "default" && apiTheme) {
                if (!themeStyle) {
                    localStorage.setItem("selected-theme-style", apiTheme.css)
                } else {
                    localStorage.setItem("selected-theme-style", themeStyle)
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

    useEffect(() => {
        setMounted(true)

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
            const apiTheme = themesApiReponse.find((theme) => theme.name.toLowerCase() === name)
            if (name !== "default" && apiTheme) {
                const style = document.createElement("style")
                style.id = "dynamic-theme-style"
                style.innerHTML = savedThemeStyle || apiTheme.css
                document.head.appendChild(style)
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
    }, [setTheme])

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

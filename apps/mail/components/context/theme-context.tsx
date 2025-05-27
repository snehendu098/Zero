import { useSettings } from "@/hooks/use-settings";
import { themes } from "@/lib/themes";
import type { ThemeName, ThemeOption, ThemeVariant } from "@/types";
import { ThemeProvider, useTheme } from "next-themes";
import { useState, createContext, useEffect } from "react";


export const CurrentThemeContext = createContext<{
    mounted: boolean;
    setMounted: (mounted: boolean) => void;
    activeTheme: ThemeOption;
    setActiveTheme: (theme: ThemeOption) => void;
    isTransitioning: boolean;
    setIsTransitioning: (isTransitioning: boolean) => void;
    applyTheme: (themeOption: ThemeOption) => void;
}>({
    mounted: false,
    setMounted: () => { },
    activeTheme: "claude-light",
    setActiveTheme: () => { },
    isTransitioning: false,
    setIsTransitioning: () => { },
    applyTheme: () => { },
});

export const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {

    const [mounted, setMounted] = useState(false)
    const [activeTheme, setActiveTheme] = useState<ThemeOption>("claude-light")
    const [isTransitioning, setIsTransitioning] = useState(false)
    const { setTheme } = useTheme()


    // Parse theme option to get name and variant
    const parseThemeOption = (option: ThemeOption): { name: ThemeName; variant: ThemeVariant } => {
        const [name, variant] = option.split("-") as [ThemeName, ThemeVariant]
        return { name, variant }
    }

    // Apply the selected theme with smooth transitions
    const applyTheme = (themeOption: ThemeOption) => {
        if (isTransitioning) return

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

            // Create and inject new theme styles
            const style = document.createElement("style")
            style.id = "dynamic-theme-style"
            style.innerHTML = themes[name]
            document.head.appendChild(style)

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

            // Remove transition class after animation completes
            setTimeout(() => {
                document.documentElement.classList.remove("theme-transition")
                setIsTransitioning(false)
            }, 300)
        })
    }

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem("selected-theme") as ThemeOption | null
        if (savedTheme) {
            setActiveTheme(savedTheme)
            applyTheme(savedTheme)
        }
    }, [])


    return (
        <CurrentThemeContext.Provider value={{
            mounted,
            setMounted,
            activeTheme,
            setActiveTheme,
            isTransitioning,
            setIsTransitioning,
            applyTheme,
        }}>
            {children}
        </CurrentThemeContext.Provider>

    );
}
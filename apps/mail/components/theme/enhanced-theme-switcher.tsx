"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Import the themes from the provided file
import { themes } from "@/lib/themes"
import { useTheme } from "next-themes"

type ThemeName = "claude" | "t3" | "bubblegum"
type ThemeVariant = "light" | "dark"
type ThemeOption = `${ThemeName}-${ThemeVariant}`

export function EnhancedThemeSwitcher() {
    const [selectedTheme, setSelectedTheme] = useState<ThemeOption>("claude-light")
    const [mounted, setMounted] = useState(false)
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

        // Animate the button
        const button = document.querySelector("[data-theme-switcher]")
        button?.classList.add("theme-switching")

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
                setTheme("dark")
                setTheme("light")
            }

            setSelectedTheme(themeOption)
            localStorage.setItem("selected-theme", themeOption)

            // Remove transition class after animation completes
            setTimeout(() => {
                document.documentElement.classList.remove("theme-transition")
                button?.classList.remove("theme-switching")
                setIsTransitioning(false)
            }, 300)
        })
    }

    // Initialize theme from localStorage
    useEffect(() => {
        setMounted(true)

        const savedTheme = localStorage.getItem("selected-theme") as ThemeOption | null
        if (savedTheme) {
            const { name, variant } = parseThemeOption(savedTheme)

            // Apply theme immediately without transitions on load
            if (variant === "dark") {
                document.documentElement.classList.add("dark")
                setTheme("dark")

            } else {
                document.documentElement.classList.remove("dark")
                setTheme("dark")

            }

            const style = document.createElement("style")
            style.id = "dynamic-theme-style"
            style.innerHTML = themes[name]
            document.head.appendChild(style)
            setSelectedTheme(savedTheme)
        } else {
            document.documentElement.classList.remove("dark")
            const style = document.createElement("style")
            style.id = "dynamic-theme-style"
            style.innerHTML = themes["claude"]
            document.head.appendChild(style)
            setSelectedTheme("claude-light")
        }
    }, [])

    // Prevent hydration mismatch
    if (!mounted) return null

    const themeColors = {
        "claude-light": "#E97451",
        "claude-dark": "#F2A68C",
        "t3-light": "#E14283",
        "t3-dark": "#E05A91",
        "bubblegum-light": "#FF6B98",
        "bubblegum-dark": "#FFD23F",
    }

    // Generate all theme options
    const themeOptions: ThemeOption[] = []
    Object.keys(themes).forEach((themeName) => {
        themeOptions.push(`${themeName}-light` as ThemeOption)
        themeOptions.push(`${themeName}-dark` as ThemeOption)
    })

    // Get display name for theme option
    const getDisplayName = (option: ThemeOption) => {
        const { name, variant } = parseThemeOption(option)
        return `${name.charAt(0).toUpperCase() + name.slice(1)} ${variant.charAt(0).toUpperCase() + variant.slice(1)}`
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="flex items-center gap-2 min-w-[180px]"
                    data-theme-switcher
                    disabled={isTransitioning}
                >
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Sun
                                className={cn(
                                    "h-4 w-4 transition-all duration-300",
                                    selectedTheme.includes("dark") ? "opacity-0 scale-0 rotate-90" : "opacity-100 scale-100 rotate-0",
                                )}
                            />
                            <Moon
                                className={cn(
                                    "h-4 w-4 absolute top-0 left-0 transition-all duration-300",
                                    selectedTheme.includes("dark") ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 -rotate-90",
                                )}
                            />
                        </div>
                        <span className="transition-opacity duration-300">{getDisplayName(selectedTheme)}</span>
                    </div>
                    <ChevronDown
                        className={cn("h-4 w-4 ml-auto transition-transform duration-200", isTransitioning && "animate-spin")}
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
                {themeOptions.map((themeOption) => {
                    const { variant } = parseThemeOption(themeOption)
                    return (
                        <DropdownMenuItem
                            key={themeOption}
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => applyTheme(themeOption)}
                            disabled={isTransitioning}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-4 w-4 rounded-full border transition-all duration-300 hover:scale-110"
                                    style={{
                                        backgroundColor: themeColors[themeOption],
                                    }}
                                />
                                <div className="flex items-center gap-1">
                                    {variant === "dark" ? (
                                        <Moon className="h-3 w-3 transition-transform duration-300 hover:rotate-12" />
                                    ) : (
                                        <Sun className="h-3 w-3 transition-transform duration-300 hover:rotate-12" />
                                    )}
                                    <span>{getDisplayName(themeOption)}</span>
                                </div>
                            </div>
                            {selectedTheme === themeOption && <Check className="h-4 w-4 animate-in fade-in duration-200" />}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

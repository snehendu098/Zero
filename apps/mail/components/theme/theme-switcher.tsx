"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// Remove: import { useTheme } from "next-themes"

// Import the themes from the provided file
import { themes } from "@/lib/themes/index"

type ThemeName = "claude" | "t3" | "bubblegum"
type ThemeVariant = "light" | "dark"
type ThemeOption = `${ThemeName}-${ThemeVariant}`

export function ThemeSwitcher() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>("claude-light")
  const [mounted, setMounted] = useState(false)
  // Remove: const { setTheme: setMode } = useTheme()

  // Parse theme option to get name and variant
  const parseThemeOption = (option: ThemeOption): { name: ThemeName; variant: ThemeVariant } => {
    const [name, variant] = option.split("-") as [ThemeName, ThemeVariant]
    return { name, variant }
  }

  // Replace the entire applyTheme function with this updated version:

  const applyTheme = (themeOption: ThemeOption) => {
    const { name, variant } = parseThemeOption(themeOption)

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
    } else {
      document.documentElement.classList.remove("dark")
    }

    setSelectedTheme(themeOption)
    localStorage.setItem("selected-theme", themeOption)
  }

  // Replace the useEffect hook with this updated version:

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("selected-theme") as ThemeOption | null
    if (savedTheme) {
      const { variant } = parseThemeOption(savedTheme)
      // Set initial dark mode class directly
      if (variant === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      applyTheme(savedTheme)
    } else {
      document.documentElement.classList.remove("dark")
      applyTheme("claude-light")
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
        <Button variant="outline" className="flex items-center gap-2 min-w-[180px]">
          <div className="flex items-center gap-2">
            {selectedTheme.includes("dark") ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span>{getDisplayName(selectedTheme)}</span>
          </div>
          <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {themeOptions.map((themeOption) => {
          const { variant } = parseThemeOption(themeOption)
          return (
            <DropdownMenuItem
              key={themeOption}
              className="flex items-center justify-between"
              onClick={() => applyTheme(themeOption)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border"
                  style={{
                    backgroundColor: themeColors[themeOption],
                  }}
                />
                <div className="flex items-center gap-1">
                  {variant === "dark" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                  <span>{getDisplayName(themeOption)}</span>
                </div>
              </div>
              {selectedTheme === themeOption && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

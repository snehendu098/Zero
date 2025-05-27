"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Check, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedThemeSwitcher } from "@/components/theme/enhanced-theme-switcher"
import { themes } from "@/lib/themes"

type ThemeName = "claude" | "t3" | "bubblegum"
type ThemeVariant = "light" | "dark"
type ThemeOption = `${ThemeName}-${ThemeVariant}`

export default function ThemesPage() {
    const [mounted, setMounted] = useState(false)
    const [activeTheme, setActiveTheme] = useState<ThemeOption>("claude-light")
    const [isTransitioning, setIsTransitioning] = useState(false)

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
            } else {
                document.documentElement.classList.remove("dark")
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

    // Initialize theme from localStorage
    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem("selected-theme") as ThemeOption | null
        if (savedTheme) {
            setActiveTheme(savedTheme)
        }
    }, [])

    // Prevent hydration mismatch
    if (!mounted) return null

    const themeDescriptions = {
        claude: "A warm, earthy theme with orange and brown tones, inspired by natural materials.",
        t3: "A vibrant purple theme with rich contrasts, perfect for creative applications.",
        bubblegum: "A playful, colorful theme with pink and teal accents, featuring fun shadow effects.",
    }

    const themeColors = {
        claude: {
            primary: "#E97451",
            secondary: "#F2D0A4",
            accent: "#F2D0A4",
            muted: "#E0E0D1",
        },
        t3: {
            primary: "#E14283",
            secondary: "#DABFDA",
            accent: "#DABFDA",
            muted: "#C8B1D6",
        },
        bubblegum: {
            primary: "#FF6B98",
            secondary: "#5FBDB0",
            accent: "#FFD23F",
            muted: "#9EEAE0",
        },
    }

    return (
        <div className="text-foreground">

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <section>


                        <Tabs defaultValue="all" className="w-full">
                            <TabsList className="mb-6">
                                <TabsTrigger value="all">All Themes</TabsTrigger>
                                <TabsTrigger value="light">Light Themes</TabsTrigger>
                                <TabsTrigger value="dark">Dark Themes</TabsTrigger>
                            </TabsList>

                            {/* All Themes */}
                            <TabsContent value="all" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.keys(themes).map((themeName) => (
                                        <div key={themeName} className="space-y-4">
                                            <h3 className="text-xl font-semibold capitalize">{themeName}</h3>
                                            <p className="text-sm text-muted-foreground">{themeDescriptions[themeName as ThemeName]}</p>

                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Light Variant */}
                                                <Card
                                                    className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${activeTheme === `${themeName}-light` ? "ring-2 ring-primary" : ""
                                                        }`}
                                                    onClick={() => applyTheme(`${themeName}-light` as ThemeOption)}
                                                >
                                                    <div
                                                        className="h-24 flex items-center justify-center"
                                                        style={{ backgroundColor: themeColors[themeName as ThemeName].primary }}
                                                    >
                                                        <Sun className="h-8 w-8 text-white" />
                                                    </div>
                                                    <CardFooter className="flex justify-between p-3">
                                                        <span className="text-sm font-medium">Light</span>
                                                        {activeTheme === `${themeName}-light` && <Check className="h-4 w-4" />}
                                                    </CardFooter>
                                                </Card>

                                                {/* Dark Variant */}
                                                <Card
                                                    className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${activeTheme === `${themeName}-dark` ? "ring-2 ring-primary" : ""
                                                        }`}
                                                    onClick={() => applyTheme(`${themeName}-dark` as ThemeOption)}
                                                >
                                                    <div
                                                        className="h-24 flex items-center justify-center"
                                                        style={{
                                                            backgroundColor: "#1F2937",
                                                            color: themeColors[themeName as ThemeName].primary,
                                                        }}
                                                    >
                                                        <Moon className="h-8 w-8" />
                                                    </div>
                                                    <CardFooter className="flex justify-between p-3">
                                                        <span className="text-sm font-medium">Dark</span>
                                                        {activeTheme === `${themeName}-dark` && <Check className="h-4 w-4" />}
                                                    </CardFooter>
                                                </Card>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* Light Themes */}
                            <TabsContent value="light" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.keys(themes).map((themeName) => (
                                        <Card
                                            key={`${themeName}-light`}
                                            className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${activeTheme === `${themeName}-light` ? "ring-2 ring-primary" : ""
                                                }`}
                                            onClick={() => applyTheme(`${themeName}-light` as ThemeOption)}
                                        >
                                            <div
                                                className="h-32 flex items-center justify-center"
                                                style={{ backgroundColor: themeColors[themeName as ThemeName].primary }}
                                            >
                                                <Sun className="h-10 w-10 text-white" />
                                            </div>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="capitalize">{themeName} Light</CardTitle>
                                                <CardDescription>{themeDescriptions[themeName as ThemeName]}</CardDescription>
                                            </CardHeader>
                                            <CardFooter className="flex justify-between pt-0">
                                                <div className="flex gap-2">
                                                    {Object.values(themeColors[themeName as ThemeName]).map((color, index) => (
                                                        <div key={index} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                                                    ))}
                                                </div>
                                                {activeTheme === `${themeName}-light` && <Check className="h-4 w-4" />}
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* Dark Themes */}
                            <TabsContent value="dark" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.keys(themes).map((themeName) => (
                                        <Card
                                            key={`${themeName}-dark`}
                                            className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${activeTheme === `${themeName}-dark` ? "ring-2 ring-primary" : ""
                                                }`}
                                            onClick={() => applyTheme(`${themeName}-dark` as ThemeOption)}
                                        >
                                            <div
                                                className="h-32 flex items-center justify-center"
                                                style={{
                                                    backgroundColor: "#1F2937",
                                                    color: themeColors[themeName as ThemeName].primary,
                                                }}
                                            >
                                                <Moon className="h-10 w-10" />
                                            </div>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="capitalize">{themeName} Dark</CardTitle>
                                                <CardDescription>{themeDescriptions[themeName as ThemeName]}</CardDescription>
                                            </CardHeader>
                                            <CardFooter className="flex justify-between pt-0">
                                                <div className="flex gap-2">
                                                    {Object.values(themeColors[themeName as ThemeName]).map((color, index) => (
                                                        <div
                                                            key={index}
                                                            className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                                                            style={{ backgroundColor: color }}
                                                        ></div>
                                                    ))}
                                                </div>
                                                {activeTheme === `${themeName}-dark` && <Check className="h-4 w-4" />}
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </section>

                    {/* Theme Preview Section */}
                    <section className="mt-12">
                        <h2 className="text-2xl font-bold mb-6">Preview Current Theme</h2>
                        <Card>
                            <CardHeader>
                                <CardTitle>Theme Preview</CardTitle>
                                <CardDescription>See how your selected theme affects various UI elements</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Buttons Preview */}
                                <div>
                                    <h4 className="text-sm font-medium mb-3">Buttons</h4>
                                    <div className="flex flex-wrap gap-3">
                                        <Button>Primary</Button>
                                        <Button variant="secondary">Secondary</Button>
                                        <Button variant="outline">Outline</Button>
                                        <Button variant="ghost">Ghost</Button>
                                        <Button variant="destructive">Destructive</Button>
                                    </div>
                                </div>

                                {/* Colors Preview */}
                                <div>
                                    <h4 className="text-sm font-medium mb-3">Colors</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="space-y-1">
                                            <div className="h-12 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-xs font-medium">
                                                Primary
                                            </div>
                                            <p className="text-xs text-center text-muted-foreground">primary</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-12 bg-secondary rounded-md flex items-center justify-center text-secondary-foreground text-xs font-medium">
                                                Secondary
                                            </div>
                                            <p className="text-xs text-center text-muted-foreground">secondary</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-12 bg-accent rounded-md flex items-center justify-center text-accent-foreground text-xs font-medium">
                                                Accent
                                            </div>
                                            <p className="text-xs text-center text-muted-foreground">accent</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-12 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs font-medium">
                                                Muted
                                            </div>
                                            <p className="text-xs text-center text-muted-foreground">muted</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Preview */}
                                <div>
                                    <h4 className="text-sm font-medium mb-3">Card</h4>
                                    <Card className="max-w-sm">
                                        <CardHeader>
                                            <CardTitle>Card Title</CardTitle>
                                            <CardDescription>Card description goes here</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm">This is how content looks in a card with your selected theme.</p>
                                        </CardContent>
                                        <CardFooter>
                                            <Button size="sm">Action</Button>
                                        </CardFooter>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </main>
        </div>
    )
}

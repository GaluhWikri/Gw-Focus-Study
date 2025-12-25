"use client"

import { useState, useEffect } from "react"
import { X, Minimize2, Maximize2, Music, ChevronLeft, ChevronRight, Disc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const CATEGORIES = [
    {
        id: "focus-deep",
        name: "Focus Deep",
        playlists: [
            { name: "Focus Flow", src: "https://open.spotify.com/embed/playlist/2sZYutAwhMODqCaS0mYj4Z?utm_source=generator" },
            { name: "Deep Work", src: "https://open.spotify.com/embed/playlist/6zCID88oNjNv9zx6puDHKj?utm_source=generator" },
            { name: "Intense Study", src: "https://open.spotify.com/embed/playlist/2YC6RDAdPt3J4yD2aJMtjt?utm_source=generator" },
            { name: "Brain Food", src: "https://open.spotify.com/embed/playlist/3cnkhyqinMpD5O6f6qh5l4?utm_source=generator" }
        ]
    },
    {
        id: "lofi-deep",
        name: "Lofi Deep",
        playlists: [
            { name: "Lofi Beats", src: "https://open.spotify.com/embed/playlist/3bZTQGrvewbkJJe6UpTFKc?utm_source=generator" },
            { name: "Chill Vibes", src: "https://open.spotify.com/embed/playlist/6HuGmDDzcvvcJ88nWrPEoG?utm_source=generator" },
            { name: "Lofi Study", src: "https://open.spotify.com/embed/playlist/2ESTi09a3yH7gpt7nN4Y4d?utm_source=generator" },
            { name: "Night Lofi", src: "https://open.spotify.com/embed/playlist/2uDVS1t0HqMnczrWgA1xcJ?utm_source=generator" }
        ]
    }
]

interface SpotifyPlayerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    color?: string
}

export function SpotifyPlayer({ open, onOpenChange, color = "#C5A059" }: SpotifyPlayerProps) {
    const [mounted, setMounted] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)
    const [isDockedExpanded, setIsDockedExpanded] = useState(true)
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id)

    // Track active playlist index for each category
    const [playlistIndices, setPlaylistIndices] = useState<Record<string, number>>({
        "focus-deep": 0,
        "lofi-deep": 0
    })

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (open) {
            setHasStarted(true)
            setIsDockedExpanded(true)
        }
    }, [open])

    const handleNavigation = (categoryId: string, direction: 'prev' | 'next') => {
        const category = CATEGORIES.find(c => c.id === categoryId)
        if (!category) return

        setPlaylistIndices(prev => {
            const currentIndex = prev[categoryId]
            const total = category.playlists.length

            let newIndex
            if (direction === 'next') {
                newIndex = (currentIndex + 1) % total
            } else {
                newIndex = (currentIndex - 1 + total) % total
            }

            return {
                ...prev,
                [categoryId]: newIndex
            }
        })
    }

    if (!mounted) return null

    const shouldRender = open || hasStarted
    if (!shouldRender) return null

    return (
        <div className="font-sans text-foreground transition-all duration-500 ease-in-out">
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/80 transition-opacity duration-300",
                    open ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                )}
                onClick={() => onOpenChange(false)}
                aria-hidden="true"
            />

            {/* Main Container */}
            <div
                className={cn(
                    "fixed z-50 bg-[#FDFBF7] shadow-lg transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden",
                    // Modal State
                    open && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl p-6 rounded-xl scale-100 opacity-100 border border-[#E0D9D5]",
                    // Docked State (Expanded)
                    !open && isDockedExpanded && "left-4 top-4 w-[340px] rounded-lg translate-x-0 translate-y-0 scale-100 opacity-100 border border-[#E0D9D5]",
                    // Docked State (Collapsed)
                    !open && !isDockedExpanded && "left-4 top-4 w-12 h-12 rounded-full translate-x-0 translate-y-0 overflow-hidden border-2"
                )}
                style={!open && !isDockedExpanded ? { borderColor: color } : {}}
                role={open ? "dialog" : "region"}
                aria-modal={open}
            >

                {/* Docked Toggle Button */}
                {!open && !isDockedExpanded && (
                    <Button
                        variant="ghost"
                        className="w-full h-full p-0 flex items-center justify-center hover:bg-black/5"
                        onClick={() => setIsDockedExpanded(true)}
                    >
                        <Music className="h-6 w-6" style={{ color: color }} />
                    </Button>
                )}

                {/* Content Wrapper */}
                <div className={cn("transition-opacity duration-300 h-full flex flex-col", !open && !isDockedExpanded ? "opacity-0 pointer-events-none invisible absolute inset-0" : "opacity-100 relative")}>
                    {/* Header Controls */}
                    <div className={cn("flex items-center justify-between", !open ? "pt-3 px-4 pb-2" : "mb-4")}>
                        {open ? (
                            <div className="flex flex-col space-y-1.5">
                                <h2 className="text-2xl font-serif font-semibold leading-none tracking-tight text-[#2C3E50]">Focus Music</h2>
                                <p className="text-sm text-muted-foreground">Select your vibe.</p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Music className="h-4 w-4" style={{ color: color }} />
                                <span className="text-sm font-medium font-serif text-[#2C3E50]">Now Playing</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1 shrink-0">
                            {!open && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-[#2C3E50]/60 hover:text-[#2C3E50]" onClick={() => setIsDockedExpanded(false)}>
                                    <Minimize2 className="h-3 w-3" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-[#2C3E50]/60 hover:text-[#2C3E50]" onClick={() => onOpenChange(!open)}>
                                {open ? <X className="h-4 w-4" /> : <Maximize2 className="h-3 w-3" />}
                                <span className="sr-only">{open ? "Close" : "Expand"}</span>
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={cn("flex-1 overflow-hidden flex flex-col", !open && "h-auto")}>
                        
                        {/* Tab Switcher */}
                        <div className={cn("px-4 pb-2", open && "px-0")}>
                            <Tabs
                                defaultValue={CATEGORIES[0].id}
                                value={activeCategory}
                                onValueChange={setActiveCategory}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-2 bg-[#E8F1F8]/50 p-1 rounded-lg">
                                    {CATEGORIES.map((category) => (
                                        <TabsTrigger
                                            key={category.id}
                                            value={category.id}
                                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#C5A059]/20 font-serif"
                                        >
                                            <span className={cn(activeCategory === category.id && "text-[#C5A059]")}>{category.name}</span>
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Playlist Content Area */}
                        <div className="flex-1 overflow-hidden px-4 pb-4">
                            {CATEGORIES.map((category) => {
                                const isActive = activeCategory === category.id
                                const activeIndex = playlistIndices[category.id]
                                const activePlaylist = category.playlists[activeIndex]
                                
                                return (
                                    <div 
                                        key={category.id} 
                                        className={cn(
                                            "h-full flex flex-col transition-all duration-300",
                                            // Ensure only active category is visible/interactable
                                            isActive ? "relative opacity-100 z-10" : "absolute inset-0 opacity-0 pointer-events-none z-0 hidden"
                                        )}
                                        style={{ display: isActive ? 'flex' : 'none' }}
                                    >
                                        <div className="rounded-xl overflow-hidden shadow-sm bg-black relative z-10 w-full shrink-0">
                                            <iframe
                                                src={activePlaylist.src}
                                                width="100%"
                                                height={open ? "352" : "152"}
                                                frameBorder="0"
                                                allowFullScreen
                                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                                loading="lazy"
                                                title={`Spotify playlist ${activePlaylist.name}`}
                                                className="bg-black block"
                                            />
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-3 px-1 w-full">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleNavigation(category.id, 'prev')}
                                                className="text-muted-foreground hover:text-foreground hover:bg-[#C5A059]/10"
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                Prev
                                            </Button>

                                            <div className="flex items-center gap-1.5 text-sm font-medium font-serif text-[#2C3E50]">
                                                {category.playlists.map((_, idx) => (
                                                        <Disc 
                                                        key={idx}
                                                        className="h-4 w-4 transition-colors"
                                                        style={{ color: idx === activeIndex ? color : undefined, opacity: idx === activeIndex ? 1 : 0.3 }}
                                                        />
                                                ))}
                                            </div>

                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleNavigation(category.id, 'next')}
                                                className="text-muted-foreground hover:text-foreground hover:bg-[#C5A059]/10"
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Play, Pause, RotateCcw, Maximize, Minimize, Settings, Music } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SpotifyPlayer } from "@/components/SpotifyPlayer"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type TimerMode = "focus" | "short-break" | "long-break"

const PREDEFINED_THEMES = [
  { name: "Classic Cream", value: "#FDFBF7" },
  { name: "Soft Blue", value: "#E8F1F8" },
  { name: "Mint Green", value: "#E8F5E9" },
  { name: "Warm Peach", value: "#FFF3E0" },
  { name: "Lavender", value: "#F3E5F5" },
  { name: "Rose", value: "#FCE4EC" },
]

const ALERT_SOUNDS = [
  { name: "Bell", value: "bell" },
  { name: "Chime", value: "chime" },
  { name: "Ding", value: "ding" },
  { name: "None", value: "none" },
]

export default function FocusStudyPage() {
  const [mode, setMode] = useState<TimerMode>("focus")
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [taskIntent, setTaskIntent] = useState("")

  const [focusDuration, setFocusDuration] = useState(25)
  const [shortBreakDuration, setShortBreakDuration] = useState(5)
  const [longBreakDuration, setLongBreakDuration] = useState(15)
  const [alertSound, setAlertSound] = useState("bell")
  const [backgroundTheme, setBackgroundTheme] = useState("#FDFBF7")
  const [textColor, setTextColor] = useState("#2C3E50")
  const [customBackground, setCustomBackground] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isMusicOpen, setIsMusicOpen] = useState(false)

  const fullscreenRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const modeConfig = {
    focus: { label: "Focus", duration: focusDuration * 60 },
    "short-break": { label: "Short Break", duration: shortBreakDuration * 60 },
    "long-break": { label: "Long Break", duration: longBreakDuration * 60 },
  }

  const playSynthesizedSound = (type: string) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return

      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      const now = ctx.currentTime

      if (type === "bell") {
        osc.type = "sine"
        osc.frequency.setValueAtTime(523.25, now) // C5
        gain.gain.setValueAtTime(0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2)
        osc.start(now)
        osc.stop(now + 2)
      } else if (type === "chime") {
        osc.type = "triangle"
        osc.frequency.setValueAtTime(659.25, now) // E5
        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)
        osc.start(now)
        osc.stop(now + 1.5)
      } else if (type === "ding") {
        osc.type = "sine"
        osc.frequency.setValueAtTime(880, now) // A5
        gain.gain.setValueAtTime(0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1)
        osc.start(now)
        osc.stop(now + 1)
      }
    } catch (error) {
      console.error("Synthesized sound failed:", error)
    }
  }

  const playSingleSound = (name: string) => {
    if (name === "none") return
    const audio = new Audio(`/sounds/alert-${name}.mp3`)
    audio.play().catch(() => {
      console.log("[v0] Audio file not found, using synthesizer fallback")
      playSynthesizedSound(name)
    })
  }

  const playAlertSound = () => {
    if (alertSound === "none") return

    // Play sound 3 times with delay to ensure user notices
    playSingleSound(alertSound)
    setTimeout(() => playSingleSound(alertSound), 750)
    setTimeout(() => playSingleSound(alertSound), 1500)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1
          const minutes = Math.floor(newTime / 60)
          const seconds = newTime % 60
          document.title = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} - The Focus Study`
          return newTime
        })
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
      document.title = "The Focus Study"

      playAlertSound()

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Timer Complete!", {
          body: `Your ${modeConfig[mode].label} session is complete.`,
        })
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft, mode])

  useEffect(() => {
    setTimeLeft(modeConfig[mode].duration)
    setIsRunning(false)
  }, [mode, focusDuration, shortBreakDuration, longBreakDuration])

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(modeConfig[mode].duration)
    document.title = "The Focus Study"
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      fullscreenRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setCustomBackground(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const applySettings = () => {
    setTimeLeft(modeConfig[mode].duration)
    setSettingsOpen(false)
  }

  const backgroundStyle = customBackground
    ? { backgroundImage: `url(${customBackground})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: backgroundTheme }

  return (
    <div
      ref={fullscreenRef}
      className={isFullscreen
        ? "min-h-screen flex flex-col items-center justify-center relative px-4"
        : "min-h-screen flex items-center justify-center px-4 py-8 transition-all duration-300"}
      style={backgroundStyle}
    >
      {isFullscreen ? (
        <>
          <Button
            onClick={toggleFullscreen}
            size="sm"
            variant="ghost"
            className="absolute top-6 right-6 hover:bg-white/30"
            style={{ color: textColor }}
          >
            <Minimize className="h-5 w-5" />
          </Button>

          <div className="absolute top-8 left-1/2 -translate-x-1/2">
            <h1 className="font-serif text-2xl tracking-tight" style={{ color: textColor, opacity: 0.6 }}>
              The Focus Study
            </h1>
          </div>

          <div className="flex flex-col items-center space-y-12">
            {taskIntent && (
              <div className="text-center">
                <p className="font-serif text-3xl mb-2" style={{ color: textColor }}>
                  Focus On
                </p>
                <p className="font-serif text-2xl italic" style={{ color: textColor }}>
                  "{taskIntent}"
                </p>
              </div>
            )}
            {!taskIntent && (
              <p className="font-serif text-3xl" style={{ color: textColor }}>
                Focus On
              </p>
            )}

            <div
              className={`text-9xl font-mono tabular-nums tracking-wider transition-colors ${timeLeft === 0 ? "animate-pulse text-[#C5A059]" : ""
                }`}
              style={timeLeft !== 0 ? { color: textColor } : {}}
            >
              {formatTime(timeLeft)}
            </div>

            <div className="flex gap-4">
              <Button
                onClick={toggleTimer}
                size="lg"
                className="rounded-lg px-8 font-sans shadow-sm transition-all hover:opacity-90"
                style={{
                  backgroundColor: textColor,
                  color: textColor,
                }}
              >
                <span className="flex items-center" style={{ filter: "invert(1) grayscale(1) contrast(9)" }}>
                  {isRunning ? (
                    <>
                      <Pause className="mr-2 h-5 w-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Start
                    </>
                  )}
                </span>
              </Button>
              <Button
                onClick={resetTimer}
                size="lg"
                variant="ghost"
                className="bg-white/30 hover:bg-white/50 rounded-lg font-sans"
                style={{ color: textColor }}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
              <Button
                onClick={() => setIsMusicOpen(true)}
                size="lg"
                variant="ghost"
                className="bg-white/30 hover:bg-white/50 rounded-lg font-sans transition-all"
                style={{ color: textColor }}
              >
                <Music className="mr-2 h-5 w-5" />
                Music
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full max-w-2xl space-y-12">
          <header className="text-center space-y-2 relative">
            <h1 className="font-serif text-4xl md:text-5xl tracking-tight" style={{ color: textColor }}>
              The Focus Study
            </h1>
            <p className="text-sm font-sans" style={{ color: textColor, opacity: 0.6 }}>
              Cultivate deep work with intention
            </p>

          </header>

          {taskIntent && (
            <div className="text-center animate-fade-in">
              <p className="font-serif text-lg md:text-xl italic" style={{ color: textColor }}>
                "{taskIntent}"
              </p>
            </div>
          )}

          <div className="text-center space-y-8">
            <div className="inline-block">
              <div
                className={`text-7xl md:text-8xl font-mono tabular-nums tracking-wider transition-colors ${timeLeft === 0 ? "animate-pulse text-[#C5A059]" : ""
                  }`}
                style={timeLeft !== 0 ? { color: textColor } : {}}
              >
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              <Button
                variant={mode === "focus" ? "default" : "ghost"}
                onClick={() => setMode("focus")}
                className={`font-sans rounded-lg transition-all ${mode === "focus" ? "" : "bg-white/30 hover:bg-white/50"
                  }`}
                style={{
                  color: textColor,
                  backgroundColor: mode === "focus" ? textColor : undefined,
                  "--bg-opacity": 0.1,
                } as React.CSSProperties}
              >
                <span style={{ opacity: mode === "focus" ? 1 : 1, filter: mode === "focus" ? "invert(1) grayscale(1) contrast(9)" : "none" }}>
                  Focus ({focusDuration}min)
                </span>
              </Button>
              <Button
                variant={mode === "short-break" ? "default" : "ghost"}
                onClick={() => setMode("short-break")}
                className={`font-sans rounded-lg transition-all ${mode === "short-break" ? "" : "bg-white/30 hover:bg-white/50"
                  }`}
                style={{
                  color: textColor,
                  backgroundColor: mode === "short-break" ? textColor : undefined,
                  "--bg-opacity": 0.1,
                } as React.CSSProperties}
              >
                <span style={{ opacity: mode === "short-break" ? 1 : 1, filter: mode === "short-break" ? "invert(1) grayscale(1) contrast(9)" : "none" }}>
                  Short Break ({shortBreakDuration}min)
                </span>
              </Button>
              <Button
                variant={mode === "long-break" ? "default" : "ghost"}
                onClick={() => setMode("long-break")}
                className={`font-sans rounded-lg transition-all ${mode === "long-break" ? "" : "bg-white/30 hover:bg-white/50"
                  }`}
                style={{
                  color: textColor,
                  backgroundColor: mode === "long-break" ? textColor : undefined,
                  "--bg-opacity": 0.1,
                } as React.CSSProperties}
              >
                <span style={{ opacity: mode === "long-break" ? 1 : 1, filter: mode === "long-break" ? "invert(1) grayscale(1) contrast(9)" : "none" }}>
                  Long Break ({longBreakDuration}min)
                </span>
              </Button>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={toggleTimer}
                size="lg"
                className="rounded-lg px-8 font-sans shadow-sm transition-all hover:opacity-90"
                style={{
                  backgroundColor: textColor,
                  color: textColor,
                }}
              >
                <span className="flex items-center" style={{ filter: "invert(1) grayscale(1) contrast(9)" }}>
                  {isRunning ? (
                    <>
                      <Pause className="mr-2 h-5 w-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Start
                    </>
                  )}
                </span>
              </Button>
              <Button
                onClick={resetTimer}
                size="lg"
                variant="ghost"
                className="bg-white/30 hover:bg-white/50 rounded-lg font-sans"
                style={{ color: textColor }}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
              <Button
                onClick={toggleFullscreen}
                size="lg"
                variant="ghost"
                className="bg-white/30 hover:bg-white/50 rounded-lg font-sans"
                style={{ color: textColor }}
              >
                <Maximize className="mr-2 h-5 w-5" />
                Fullscreen
              </Button>

              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="bg-white/30 hover:bg-white/50 rounded-lg font-sans"
                    style={{ color: textColor }}
                  >
                    <Settings className="mr-2 h-5 w-5" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-3xl mb-2">Settings</DialogTitle>
                    <DialogDescription>Customize your focus environment to suit your workflow.</DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="timer" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                      <TabsTrigger value="timer">Timer</TabsTrigger>
                      <TabsTrigger value="sound">Sound</TabsTrigger>
                      <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="timer" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-sans font-medium text-lg">Timer Duration</h3>
                        <p className="text-sm text-muted-foreground">Adjust the duration for your focus sessions and breaks.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="focus-duration" className="text-base">Focus (min)</Label>
                            <Input
                              id="focus-duration"
                              type="number"
                              min="1"
                              max="60"
                              value={focusDuration}
                              onChange={(e) => setFocusDuration(Number(e.target.value))}
                              className="h-12 text-lg"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="short-break-duration" className="text-base">Short Break (min)</Label>
                            <Input
                              id="short-break-duration"
                              type="number"
                              min="1"
                              max="30"
                              value={shortBreakDuration}
                              onChange={(e) => setShortBreakDuration(Number(e.target.value))}
                              className="h-12 text-lg"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="long-break-duration" className="text-base">Long Break (min)</Label>
                            <Input
                              id="long-break-duration"
                              type="number"
                              min="1"
                              max="60"
                              value={longBreakDuration}
                              onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                              className="h-12 text-lg"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="sound" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-sans font-medium text-lg">Alert Sound</h3>
                        <p className="text-sm text-muted-foreground">Choose the sound that plays when a timer ends.</p>

                        <RadioGroup
                          value={alertSound}
                          onValueChange={(val) => {
                            setAlertSound(val)
                            playSingleSound(val)
                          }}
                          className="grid grid-cols-2 gap-4 pt-2"
                        >
                          {ALERT_SOUNDS.map((sound) => (
                            <div key={sound.value}>
                              <RadioGroupItem value={sound.value} id={sound.value} className="peer sr-only" />
                              <Label
                                htmlFor={sound.value}
                                className="flex items-center justify-between px-4 py-4 bg-white border-2 rounded-xl cursor-pointer hover:border-[#C5A059]/50 peer-data-[state=checked]:border-[#C5A059] peer-data-[state=checked]:bg-[#C5A059]/5 transition-all"
                              >
                                <span className="text-base font-medium">{sound.name}</span>
                                {alertSound === sound.value && <div className="w-2 h-2 rounded-full bg-[#C5A059]" />}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-8">
                      {/* Background Theme Settings */}
                      <div className="space-y-4">
                        <h3 className="font-sans font-medium text-lg">Background</h3>
                        <p className="text-sm text-muted-foreground">Select a solid color or upload your own image.</p>

                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {PREDEFINED_THEMES.map((theme) => (
                            <button
                              key={theme.value}
                              onClick={() => {
                                setBackgroundTheme(theme.value)
                                setCustomBackground(null)
                              }}
                              className={`aspect-square rounded-full border-2 transition-all relative group ${backgroundTheme === theme.value && !customBackground
                                ? "border-[#C5A059] ring-2 ring-[#C5A059]/20 scale-110"
                                : "border-transparent ring-1 ring-border"
                                }`}
                              style={{ backgroundColor: theme.value }}
                              title={theme.name}
                            >
                              {backgroundTheme === theme.value && !customBackground && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-[#2C3E50] rounded-full" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>

                        <div className="pt-2">
                          <Label className="text-sm font-medium mb-2 block">Custom Image</Label>
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 h-12"
                            >
                              Upload Image
                            </Button>
                            {customBackground && (
                              <Button type="button" variant="ghost" onClick={() => setCustomBackground(null)} className="h-12 px-4 text-red-500 hover:text-red-600 hover:bg-red-50">
                                Remove
                              </Button>
                            )}
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundUpload}
                            className="hidden"
                          />
                          {customBackground && (
                            <div className="mt-3 relative h-32 w-full rounded-xl overflow-hidden border">
                              <img
                                src={customBackground || "/placeholder.svg"}
                                alt="Custom background preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Text Color Settings */}
                      <div className="space-y-4 border-t pt-6">
                        <h3 className="font-sans font-medium text-lg">Text Color</h3>
                        <div className="flex flex-col sm:flex-row gap-6">
                          <div className="flex-1">
                            <div
                              className="h-32 rounded-xl flex items-center justify-center border shadow-sm overflow-hidden relative"
                              style={
                                customBackground
                                  ? {
                                    backgroundImage: `url(${customBackground})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                  }
                                  : { backgroundColor: backgroundTheme }
                              }
                            >
                              <span
                                className="font-serif text-5xl font-medium relative z-10 transition-colors drop-shadow-sm"
                                style={{ color: textColor }}
                              >
                                12:30
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3 min-w-[200px]">
                            <Label className="text-sm text-muted-foreground">Choose Color</Label>
                            <div className="flex items-center gap-3">
                              <Input
                                type="color"
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="w-full h-12 p-1 cursor-pointer block"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">Select a color that contrasts well with your background.</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="pt-6 border-t mt-2">
                    <Button onClick={applySettings} className="w-full h-12 text-lg bg-[#C5A059] hover:bg-[#B39149]">
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={() => setIsMusicOpen(true)}
                size="lg"
                variant="ghost"
                className="bg-white/30 hover:bg-white/50 rounded-lg font-sans transition-all"
                style={{ color: textColor }}
              >
                <Music className="mr-2 h-5 w-5" />
                Music
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-sans text-center" style={{ color: textColor, opacity: 0.7 }}>
              What will you focus on?
            </label>
            <Input
              type="text"
              placeholder="Enter your session goal..."
              value={taskIntent}
              onChange={(e) => setTaskIntent(e.target.value)}
              className="text-center font-sans border-[#E0D9D5] focus:border-[#C5A059] focus:ring-[#C5A059]/20 bg-white/50 placeholder:text-opacity-40 rounded-lg"
              style={{ color: textColor }} // We might need to handle placeholder color too, but that is harder with inline styles. Usually default placeholder opacity handles it well enough if text color inherits or we set it.
            />
          </div>

          <footer className="text-center text-xs font-sans" style={{ color: textColor, opacity: 0.4 }}>
            <p>Designed for deep, intentional work</p>
          </footer>
        </div>
      )}
      <SpotifyPlayer open={isMusicOpen} onOpenChange={setIsMusicOpen} color={textColor} />
    </div>
  )
}

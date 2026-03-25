"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  FaVolumeHigh,
  FaBookOpen,
  FaGear,
  FaAward,
  FaInfo,
  FaHeadphones,
  FaArrowRotateLeft,
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaGlobe,
  FaEnvelope,
  FaPlus,
  FaArrowUp,
  FaUsers,
  FaCodepen,
  FaMusic,
  FaKeyboard,
  FaSun,
  FaMoon,
  FaQuestion,
} from "react-icons/fa6"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useTheme } from "next-themes"

interface AudioContextType extends AudioContext {
  createGain(): GainNode
  createBufferSource(): AudioBufferSourceNode
  createConvolver(): ConvolverNode
  decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer>
}

export default function WebHarmonium() {
  const { theme, setTheme } = useTheme()
  const [isLoaded, setIsLoaded] = useState(false)
  const [volume, setVolume] = useState(80)
  const [useReverb, setUseReverb] = useState(false)
  const [transpose, setTranspose] = useState(0)
  const [currentOctave, setCurrentOctave] = useState(3)
  const [additionalReeds, setAdditionalReeds] = useState(0)
  const [midiDevices, setMidiDevices] = useState<any[]>([])
  const [selectedMidiDevice, setSelectedMidiDevice] = useState<string>("")
  const [midiSupported, setMidiSupported] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const audioContextRef = useRef<AudioContextType | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const reverbBufferRef = useRef<AudioBuffer | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const reverbNodeRef = useRef<ConvolverNode | null>(null)
  const sourceNodesRef = useRef<(AudioBufferSourceNode | null)[]>([])
  const sourceNodeStateRef = useRef<number[]>([])

  const keyboardMap: { [key: string]: number } = {
    s: 53,
    S: 53,
    a: 54,
    A: 54,
    "`": 55,
    "1": 56,
    q: 57,
    Q: 57,
    "2": 58,
    w: 59,
    W: 59,
    e: 60,
    E: 60,
    "4": 61,
    r: 62,
    R: 62,
    "5": 63,
    t: 64,
    T: 64,
    y: 65,
    Y: 65,
    "7": 66,
    u: 67,
    U: 67,
    "8": 68,
    i: 69,
    I: 69,
    "9": 70,
    o: 71,
    O: 71,
    p: 72,
    P: 72,
    "-": 73,
    "[": 74,
    "=": 75,
    "]": 76,
    "\\": 77,
    "'": 78,
    ";": 79,
  }

  const octaveMap = [-36, -24, -12, 0, 12, 24, 36]
  const baseKeyNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  const keyMap = useRef<number[]>([])
  const baseKeyMap = useRef<number[]>([])

  // Check if guide has been shown before
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("harmonium-guide-seen")
    if (!hasSeenGuide && isLoaded) {
      setShowGuide(true)
      localStorage.setItem("harmonium-guide-seen", "true")
    }
  }, [isLoaded])

  const initializeAudio = useCallback(async () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContext()

      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.gain.value = volume / 100
      gainNodeRef.current.connect(audioContextRef.current.destination)

      reverbNodeRef.current = audioContextRef.current.createConvolver()
      reverbNodeRef.current.connect(audioContextRef.current.destination)

      try {
        const harmoniumResponse = await fetch(
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/harmonium-kannan-orig-6DIgVWUXlXjskJRcrUvRNLUBNigcyy.wav",
        )
        if (!harmoniumResponse.ok) {
          throw new Error(`HTTP error! status: ${harmoniumResponse.status}`)
        }
        const harmoniumArrayBuffer = await harmoniumResponse.arrayBuffer()
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(harmoniumArrayBuffer)
      } catch (audioError) {
        console.warn("Could not load harmonium sample, using fallback:", audioError)
        const sampleRate = audioContextRef.current.sampleRate
        const duration = 2
        const buffer = audioContextRef.current.createBuffer(1, sampleRate * duration, sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.1
        }
        audioBufferRef.current = buffer
      }

      try {
        const reverbResponse = await fetch(
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/reverb-OkQQ8iqL5OAhhMOQOXryBDa6TDHb1a.wav",
        )
        if (reverbResponse.ok) {
          const reverbArrayBuffer = await reverbResponse.arrayBuffer()
          reverbBufferRef.current = await audioContextRef.current.decodeAudioData(reverbArrayBuffer)
          reverbNodeRef.current.buffer = reverbBufferRef.current
        }
      } catch (reverbError) {
        console.warn("Could not load reverb sample:", reverbError)
      }

      initializeKeyMap()
      initializeSourceNodes()

      setTimeout(() => setIsLoaded(true), 2500)
    } catch (error) {
      console.error("Error initializing audio:", error)
      setTimeout(() => setIsLoaded(true), 2500)
    }
  }, [volume])

  const initializeKeyMap = useCallback(() => {
    const middleC = 60
    const rootKey = 62
    const startKey = middleC - 124 + (rootKey - middleC)

    for (let i = 0; i < 128; i++) {
      baseKeyMap.current[i] = startKey + i
      keyMap.current[i] = baseKeyMap.current[i] + transpose
    }
  }, [transpose])

  const stopAllVoices = useCallback(() => {
    if (!sourceNodesRef.current || !sourceNodeStateRef.current) return

    for (let i = 0; i < sourceNodesRef.current.length; i++) {
      const node = sourceNodesRef.current[i]
      if (node && sourceNodeStateRef.current[i] === 1) {
        try {
          node.stop(0)
        } catch (e) {}
        sourceNodeStateRef.current[i] = 0
      }
    }
  }, [])

  // Helper function to create or reset a source node for a specific index
  const setSourceNode = useCallback(
    (index: number) => {
      if (!audioContextRef.current || !audioBufferRef.current || !gainNodeRef.current) {
        return
      }

      // If there's a playing node, stop it before resetting
      if (sourceNodesRef.current[index] && sourceNodeStateRef.current[index] === 1) {
        try {
          sourceNodesRef.current[index]?.stop(0)
        } catch (e) {}
        sourceNodeStateRef.current[index] = 0 // Mark as stopped
      }

      const src = audioContextRef.current.createBufferSource()
      src.buffer = audioBufferRef.current
      src.loop = true
      src.loopStart = 0.5
      src.loopEnd = 7.5

      // Apply detune for this key
      if (keyMap.current[index] !== 0) {
        src.detune.value = keyMap.current[index] * 100
      }

      // Route through gain (reverb routing handled centrally via useEffect)
      src.connect(gainNodeRef.current)

      sourceNodesRef.current[index] = src
    },
    [keyMap],
  ) // Include keyMap as it's used internally

  const initializeSourceNodes = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current) return

    // Ensure any playing voices are stopped before resetting
    stopAllVoices()

    sourceNodesRef.current = new Array(128).fill(null)
    sourceNodeStateRef.current = new Array(128).fill(0)

    for (let i = 0; i < 128; i++) {
      setSourceNode(i)
    }
  }, [stopAllVoices, setSourceNode])

  const noteOn = useCallback(
    (note: number) => {
      const index = note + octaveMap[currentOctave]
      if (index < sourceNodesRef.current.length && sourceNodeStateRef.current[index] === 0) {
        sourceNodesRef.current[index]?.start(0)
        sourceNodeStateRef.current[index] = 1
      }

      for (let c = 1; c <= additionalReeds; c++) {
        const additionalIndex = note + octaveMap[currentOctave + c]
        if (additionalIndex < sourceNodesRef.current.length && sourceNodeStateRef.current[additionalIndex] === 0) {
          sourceNodesRef.current[additionalIndex]?.start(0)
          sourceNodeStateRef.current[additionalIndex] = 1
        }
      }
    },
    [currentOctave, additionalReeds],
  )

  const noteOff = useCallback(
    (note: number) => {
      const index = note + octaveMap[currentOctave]
      if (index < sourceNodesRef.current.length) {
        setSourceNode(index)
      }

      for (let c = 1; c <= additionalReeds; c++) {
        const additionalIndex = note + octaveMap[currentOctave + c]
        if (additionalIndex < sourceNodesRef.current.length) {
          setSourceNode(additionalIndex)
        }
      }
    },
    [currentOctave, additionalReeds, setSourceNode],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat || !isLoaded) return

      const key = event.key
      const ctrlKey = event.ctrlKey
      const altKey = event.altKey

      // Control shortcuts - NEW SHORTCUTS
      if (altKey && !ctrlKey) {
        event.preventDefault()
        switch (key.toLowerCase()) {
          case "arrowup":
            setVolume((prev) => Math.min(100, prev + 5))
            return
          case "arrowdown":
            setVolume((prev) => Math.max(0, prev - 5))
            return
        }
      }

      if (ctrlKey && altKey) {
        event.preventDefault()
        switch (key.toLowerCase()) {
          case "arrowup":
            setCurrentOctave((prev) => Math.min(6, prev + 1))
            return
          case "arrowdown":
            setCurrentOctave((prev) => Math.max(0, prev - 1))
            return
          case "r":
            setUseReverb((prev) => !prev)
            return
          case "arrowleft":
            setTranspose((prev) => Math.max(-11, prev - 1))
            return
          case "arrowright":
            setTranspose((prev) => Math.min(11, prev + 1))
            return
          case "=":
          case "+":
            setAdditionalReeds((prev) => Math.min(6 - currentOctave, prev + 1))
            return
          case "-":
            setAdditionalReeds((prev) => Math.max(0, prev - 1))
            return
        }
      }

      // Musical keys
      if (keyboardMap[key] !== undefined) {
        noteOn(keyboardMap[key])
      }
    },
    [isLoaded, noteOn, currentOctave],
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!isLoaded) return

      const key = event.key
      if (keyboardMap[key] !== undefined) {
        noteOff(keyboardMap[key])
      }
    },
    [isLoaded, noteOff],
  )

  const initializeMIDI = useCallback(async () => {
    if (typeof navigator === "undefined" || typeof navigator.requestMIDIAccess !== "function") {
      setMidiSupported(false)
      return
    }

    try {
      const midiAccess = await navigator.requestMIDIAccess({ sysex: false })
      setMidiSupported(true)

      const devices: any[] = []
      for (const input of midiAccess.inputs.values()) {
        devices.push({
          id: input.id,
          name: input.name,
          manufacturer: input.manufacturer,
        })

        input.onmidimessage = (message: any) => {
          if (selectedMidiDevice === input.id || selectedMidiDevice === "") {
            const [command, note, velocity = 0] = message.data
            if (command === 144 && velocity > 0) noteOn(note)
            else if (command === 128 || (command === 144 && velocity === 0)) noteOff(note)
          }
        }
      }
      setMidiDevices(devices)
    } catch (err) {
      console.warn("WebMIDI disabled:", err)
      setMidiSupported(false)
    }
  }, [selectedMidiDevice, noteOn, noteOff])

  useEffect(() => {
    initializeAudio()
    initializeMIDI()
  }, [initializeAudio, initializeMIDI])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100
    }
  }, [volume])

  useEffect(() => {
    initializeKeyMap()
    initializeSourceNodes()
  }, [transpose, initializeKeyMap, initializeSourceNodes])

  useEffect(() => {
    if (gainNodeRef.current && reverbNodeRef.current) {
      if (useReverb) {
        try {
          gainNodeRef.current.connect(reverbNodeRef.current)
        } catch (e) {}
      } else {
        try {
          gainNodeRef.current.disconnect(reverbNodeRef.current)
        } catch (e) {}
      }
    }
  }, [useReverb])

  // New effect to stop all voices on parameter change that could cause stuck notes
  useEffect(() => {
    if (!audioContextRef.current) return
    stopAllVoices()
    initializeSourceNodes()
  }, [volume, useReverb, transpose, currentOctave, additionalReeds, stopAllVoices, initializeSourceNodes])

  // Stop all voices when the window loses focus
  useEffect(() => {
    const onBlur = () => stopAllVoices()
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("blur", onBlur)
    }
  }, [stopAllVoices])

  const getRootNoteName = () => {
    return baseKeyNames[transpose >= 0 ? transpose % 12 : transpose + 12]
  }

  const HarmoniumKeys = () => {
    const keys = [
      { key: "1", type: "black", note: "Ṗ" },
      { key: "q", type: "white", note: "Ḍ", keyName: "D" },
      { key: "2", type: "black", note: "Ḍ" },
      { key: "w", type: "white", note: "Ṇ", keyName: "E" },
      { key: "e", type: "white", note: "Ṇ", keyName: "F" },
      { key: "4", type: "black", note: "S" },
      { key: "r", type: "white", note: "R", keyName: "G" },
      { key: "5", type: "black", note: "R" },
      { key: "t", type: "white", note: "G", keyName: "A" },
      { key: "y", type: "white", note: "G", keyName: "B" },
      { key: "7", type: "black", note: "M" },
      { key: "u", type: "white", note: "M", keyName: "C" },
      { key: "8", type: "black", note: "P" },
      { key: "i", type: "white", note: "D", keyName: "D" },
      { key: "9", type: "black", note: "D" },
      { key: "o", type: "white", note: "N", keyName: "E" },
      { key: "p", type: "white", note: "N", keyName: "F" },
      { key: "-", type: "black", note: "Ṡ" },
      { key: "[", type: "white", note: "Ṙ", keyName: "G" },
      { key: "=", type: "black", note: "Ṙ" },
      { key: "]", type: "white", note: "Ġ", keyName: "A" },
      { key: "\\", type: "white", note: "Ġ", keyName: "B" },
    ]

    const handlePointerDown = (keyboardKey: string) => {
      const note = keyboardMap[keyboardKey]
      if (note !== undefined) {
        noteOn(note)
      }
    }

    const handlePointerUp = (keyboardKey: string) => {
      const note = keyboardMap[keyboardKey]
      if (note !== undefined) {
        noteOff(note)
      }
    }

    return (
      <div className="mb-6 flex justify-center sm:mb-8">
        <div className="w-full max-w-6xl px-2 sm:px-0">
          <div className="minimal-section overflow-hidden p-4 sm:p-6">
            <div className="relative overflow-x-auto rounded-xl border border-border/80 bg-secondary/35 p-3 sm:p-4">
              <div className="flex justify-center overflow-auto">
                <div className="relative flex min-h-40 min-w-max">
                  {keys.map((keyData) => {
                    const isWhite = keyData.type === "white"
                    const k = keyData.key
                    return (
                      <div
                        key={k}
                        className={`relative ${isWhite ? "z-10" : "z-20"}`}
                        style={{
                          marginLeft: isWhite ? "0" : "-12px",
                          marginRight: isWhite ? "0" : "-12px",
                        }}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label={`Play ${keyData.note} using keyboard key ${keyData.key}`}
                          onMouseDown={() => handlePointerDown(k)}
                          onMouseUp={() => handlePointerUp(k)}
                          onMouseLeave={() => handlePointerUp(k)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              handlePointerDown(k)
                            }
                          }}
                          onKeyUp={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              handlePointerUp(k)
                            }
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault()
                            handlePointerDown(k)
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault()
                            handlePointerUp(k)
                          }}
                          onTouchCancel={(e) => {
                            e.preventDefault()
                            handlePointerUp(k)
                          }}
                          className={` ${isWhite ? "h-28 w-11 sm:h-32 sm:w-12" : "h-20 w-8 sm:h-20 sm:w-8"} ${
                            isWhite
                              ? "border border-stone-300 bg-gradient-to-b from-stone-50 to-white shadow-sm hover:border-stone-400"
                              : "border border-stone-700 bg-gradient-to-b from-stone-900 to-stone-800 shadow-md hover:border-stone-600"
                          } flex cursor-pointer select-none flex-col justify-between rounded-md p-1 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px active:scale-[0.99] sm:p-2`}
                        >
                          <div className="text-center">
                            <div
                              className={`rounded px-1 py-0.5 text-xs font-bold ${
                                isWhite ? "bg-stone-900 text-stone-100" : "bg-stone-100/10 text-stone-200"
                              } `}
                            >
                              {keyData.key}
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col justify-center text-center">
                            <div
                              className={`text-sm font-bold sm:text-base ${
                                isWhite ? "text-stone-700" : "text-stone-300"
                              }`}
                            >
                              {keyData.note}
                            </div>
                          </div>

                          {isWhite && (
                            <div className="text-center">
                              <div className="rounded bg-stone-200 px-1 py-0.5 text-xs font-bold text-stone-700">
                                {keyData.keyName}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Keyboard Shortcuts Dialog
  const ShortcutsDialog = () => (
      <DialogContent className="m-auto mx-2 max-h-[90vh] max-w-[95vw] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="mb-2 text-center font-serif text-2xl font-semibold sm:text-3xl">
            ⌨️ Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
              <FaVolumeHigh className="h-5 w-5" />
              Volume Control
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-secondary/70 p-3">
                <span>Increase Volume</span>
                <Badge className="bg-primary text-primary-foreground">Alt + ↑</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md bg-secondary/70 p-3">
                <span>Decrease Volume</span>
                <Badge className="bg-primary text-primary-foreground">Alt + ↓</Badge>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
              <FaGear className="h-5 w-5" />
              Reverb Toggle
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-secondary/70 p-3">
                <span>Toggle Reverb</span>
                <Badge className="bg-primary text-primary-foreground">Ctrl + Alt + R</Badge>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
              <FaMusic className="h-5 w-5" />
              Transpose
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-secondary/70 p-3">
                <span>Transpose Up</span>
                <Badge className="bg-primary text-primary-foreground">Ctrl + Alt + →</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md bg-secondary/70 p-3">
                <span>Transpose Down</span>
                <Badge className="bg-primary text-primary-foreground">Ctrl + Alt + ←</Badge>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
              <FaArrowUp className="h-5 w-5" />
              Octave Control
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-secondary/70 p-3">
                <span>Octave Up</span>
                <Badge className="bg-primary text-primary-foreground">Ctrl + Alt + ↑</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md bg-secondary/70 p-3">
                <span>Octave Down</span>
                <Badge className="bg-primary text-primary-foreground">Ctrl + Alt + ↓</Badge>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
              <FaPlus className="h-5 w-5" />
              Additional Reeds
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-secondary/70 p-3">
                <span>Add Reed</span>
                <Badge className="bg-primary text-primary-foreground">Ctrl + Alt + +</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md bg-secondary/70 p-3">
                <span>Remove Reed</span>
                <Badge className="bg-primary text-primary-foreground">Ctrl + Alt + -</Badge>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground">
              <FaKeyboard className="h-5 w-5" />
              Musical Keys
            </h3>
            <div className="space-y-2 text-sm">
              <div className="rounded-md bg-secondary/70 p-3">
                <div className="mb-1 font-semibold">White Keys:</div>
                <div className="font-mono text-xs">` q w e r t y u i o p [ ] \</div>
              </div>
              <div className="rounded-md bg-secondary/70 p-3">
                <div className="mb-1 font-semibold">Black Keys:</div>
                <div className="font-mono text-xs">1 2 4 5 7 8 9 - =</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={() => setShowShortcuts(false)}
            className="rounded-xl border border-border/80 bg-background px-8 py-3 text-lg font-semibold text-foreground"
          >
            Got it! 🎹
          </Button>
        </div>
      </DialogContent>
  )

  // Enhanced Guide Dialog with more information
  const GuideDialog = () => (
      <DialogContent className="m-auto mx-2 max-h-[90vh] max-w-[95vw] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="mb-2 text-center font-serif text-2xl font-semibold sm:text-3xl">
            🎹 Complete Harmonium Guide
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {/* Keyboard Controls */}
          <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              <div className="rounded-xl bg-primary p-2 shadow-sm sm:p-3">
                <FaKeyboard className="h-4 w-4 text-white sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground sm:text-xl">Keyboard Layout</h3>
            </div>
            <div className="space-y-2 text-muted-foreground sm:space-y-3">
              <p className="text-xs font-medium sm:text-sm">
                <span className="font-bold text-foreground">White Keys:</span>
                <br />` q w e r t y u i o p [ ] \
              </p>
              <p className="text-xs font-medium sm:text-sm">
                <span className="font-bold text-foreground">Black Keys:</span>
                <br />1 2 4 5 7 8 9 - =
              </p>
              <div className="glass-card rounded-xl p-2 sm:p-3">
                <p className="text-xs italic text-muted-foreground">
                  Each key displays keyboard shortcut, Sargam notation, and Western notes for easy learning
                </p>
              </div>
            </div>
          </div>

          {/* Sargam System */}
          <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              <div className="rounded-xl bg-primary p-2 shadow-sm sm:p-3">
                <FaMusic className="h-4 w-4 text-white sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground sm:text-xl">Sargam System</h3>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground sm:text-sm">
              <div className="grid grid-cols-1 gap-1">
                <p>
                  <span className="font-semibold text-foreground">Sa (S)</span> - Tonic, foundation note (Do)
                </p>
                <p>
                  <span className="font-semibold text-foreground">Re (R)</span> - Second, melodic movement (Re)
                </p>
                <p>
                  <span className="font-semibold text-foreground">Ga (G)</span> - Third, harmonic color (Mi)
                </p>
                <p>
                  <span className="font-semibold text-foreground">Ma (M)</span> - Fourth, perfect interval (Fa)
                </p>
                <p>
                  <span className="font-semibold text-foreground">Pa (P)</span> - Fifth, dominant stable (Sol)
                </p>
                <p>
                  <span className="font-semibold text-foreground">Dha (D)</span> - Sixth, subdominant (La)
                </p>
                <p>
                  <span className="font-semibold text-foreground">Ni (N)</span> - Seventh, leading tone (Ti)
                </p>
              </div>
            </div>
          </div>

          {/* Playing Techniques */}
          <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              <div className="rounded-xl bg-primary p-2 shadow-sm sm:p-3">
                <FaGear className="h-4 w-4 text-white sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground sm:text-xl">Playing Techniques</h3>
            </div>
            <ul className="list-none space-y-2 text-xs text-muted-foreground sm:text-sm">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">•</span>
                <div>
                  <strong>Meend:</strong> Smooth gliding between notes for emotional expression
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">•</span>
                <div>
                  <strong>Gamak:</strong> Rapid oscillation between adjacent notes
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">•</span>
                <div>
                  <strong>Kan:</strong> Quick grace notes for ornamentation
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">•</span>
                <div>
                  <strong>Andolan:</strong> Gentle vibrato for expression
                </div>
              </li>
            </ul>
          </div>

          {/* Technical Specifications */}
          <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              <div className="rounded-xl bg-primary p-2 shadow-sm sm:p-3">
                <FaInfo className="h-4 w-4 text-white sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground sm:text-xl">Technical Details</h3>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground sm:text-sm">
              <p>
                <strong>Reed System:</strong> Free reeds made of brass or steel
              </p>
              <p>
                <strong>Keyboard:</strong> Usually 3-4 octaves (36-48 keys)
              </p>
              <p>
                <strong>Bellows:</strong> Hand-operated air supply system
              </p>
              <p>
                <strong>Tuning:</strong> Fixed tuning, usually in C major
              </p>
              <p>
                <strong>Stops:</strong> Multiple reed sets for different timbres
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center sm:mt-6">
          <Button
            onClick={() => setShowGuide(false)}
            className="w-full rounded-xl border border-border/80 bg-background px-6 py-2 text-base font-semibold text-foreground sm:w-auto sm:px-8 sm:py-3 sm:text-lg"
          >
            Start Playing! 🎵
          </Button>
        </div>
      </DialogContent>
  )

  if (!isLoaded) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="glass-card z-10 mx-4 w-full max-w-md rounded-2xl border p-10 text-center shadow-medium">
          <div className="relative mb-8">
            <div className="relative mx-auto h-24 w-24">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/25"></div>
              <div
                className="absolute inset-2 animate-spin rounded-full border-4 border-primary/45"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FaMusic className="h-10 w-10 animate-pulse text-primary" />
              </div>
            </div>
          </div>

          <h2 className="mb-4 font-serif text-3xl font-semibold text-foreground">
            🎵 Loading Harmonium
          </h2>
          <p className="mb-6 text-base text-muted-foreground">Preparing authentic sounds...</p>

          <div className="mb-4 h-2 w-full rounded-full bg-secondary/70">
            <div
              className="h-2 animate-pulse rounded-full bg-primary/70"
              style={{ width: "70%" }}
            ></div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex animate-pulse items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <span>Audio engine initialization</span>
            </div>
            <div className="flex animate-pulse items-center justify-center gap-2" style={{ animationDelay: "0.5s" }}>
              <div className="h-2 w-2 rounded-full bg-primary/80"></div>
              <span>Loading harmonium samples</span>
            </div>
            <div className="flex animate-pulse items-center justify-center gap-2" style={{ animationDelay: "1s" }}>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <span>MIDI device detection</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen transition-colors duration-300">
      <div className="minimal-shell relative z-10">
        {/* Enhanced Colorful Header */}
        <header className="minimal-section mb-6 flex flex-col items-center justify-between gap-4 sm:mb-8 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="relative rounded-full bg-primary p-3 shadow-sm">
                <FaMusic className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
                Web Harmonium
              </h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Digital Indian Classical Music Experience
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Key: {getRootNoteName()}
            </Badge>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Oct: {currentOctave}
            </Badge>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              Vol: {volume}%
            </Badge>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-right text-xs text-muted-foreground sm:min-w-[340px]">
              <div className="flex items-center justify-end gap-2">
                <FaGithub className="h-3.5 w-3.5 text-foreground" />
                <span>GitHub - </span>
                <a
                  href="https://github.com/Aditya060806"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  https://github.com/Aditya060806
                </a>
              </div>
              <div className="mt-1 flex items-center justify-end gap-2">
                <FaLinkedin className="h-3.5 w-3.5 text-foreground" />
                <span>LinkedIn - </span>
                <a
                  href="https://www.linkedin.com/in/aditya-pandey-p1002/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  https://www.linkedin.com/in/aditya-pandey-p1002/
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Dialog open={showGuide} onOpenChange={setShowGuide}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    aria-label="Open harmonium guide"
                    className="hover-lift border border-border/80 bg-background text-foreground"
                  >
                    <FaQuestion className="h-4 w-4" />
                    <span className="hidden sm:inline">Guide</span>
                  </Button>
                </DialogTrigger>
                <GuideDialog />
              </Dialog>

              <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    aria-label="Open keyboard shortcuts"
                    className="hover-lift border border-border/80 bg-background text-foreground"
                  >
                    <FaKeyboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Shortcuts</span>
                  </Button>
                </DialogTrigger>
                <ShortcutsDialog />
              </Dialog>

              <Button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                size="sm"
                aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
                className="hover-lift border border-border/80 bg-background text-foreground"
              >
                {theme === "light" ? <FaMoon className="h-4 w-4" /> : <FaSun className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">{theme === "light" ? "Dark" : "Light"}</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Harmonium Keys */}
        <HarmoniumKeys />

        {/* Colorful Control Cards */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:mb-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {/* Volume Control */}
          <Card className="glass-card glass-card-hover hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-primary p-2 shadow-sm">
                  <FaVolumeHigh className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Volume</div>
                  <div className="text-xs text-muted-foreground">Alt+↑↓</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-foreground">{volume}%</div>
                </div>
                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  aria-label="Master volume"
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-center text-xs text-muted-foreground">
                  {volume === 0 ? "Muted" : volume > 75 ? "High" : volume > 25 ? "Medium" : "Low"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reverb Control */}
          <Card className="glass-card glass-card-hover hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-primary p-2 shadow-sm">
                  <FaGear className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Reverb</div>
                  <div className="text-xs text-muted-foreground">Ctrl+Alt+R</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-lg font-semibold text-foreground">{useReverb ? "ON" : "OFF"}</div>
                </div>
                <div className="flex items-center justify-center">
                  <Switch checked={useReverb} onCheckedChange={setUseReverb} aria-label="Toggle reverb effect" />
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  {useReverb ? "Spatial" : "Direct"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MIDI Control */}
          <Card className="glass-card glass-card-hover hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-primary p-2 shadow-sm">
                  <FaKeyboard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">MIDI</div>
                  <div className="text-xs text-muted-foreground">External</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <Badge
                    variant={midiSupported ? "secondary" : "destructive"}
                    className="border border-border/80 bg-secondary px-2 py-1 text-xs text-foreground"
                  >
                    {midiSupported ? "✓" : "✗"}
                  </Badge>
                </div>
                {midiDevices.length > 0 && (
                  <Select value={selectedMidiDevice} onValueChange={setSelectedMidiDevice}>
                    <SelectTrigger className="glass-card h-8 text-xs" aria-label="Select MIDI input device">
                      <SelectValue placeholder="Device" />
                    </SelectTrigger>
                    <SelectContent>
                      {midiDevices.map((device) => (
                        <SelectItem key={device.id} value={device.id} className="text-xs">
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="text-center text-xs text-muted-foreground">
                  {midiDevices.length} Device
                  {midiDevices.length !== 1 ? "s" : ""}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transpose Control */}
          <Card className="glass-card glass-card-hover hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-primary p-2 shadow-sm">
                  <FaMusic className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Transpose</div>
                  <div className="text-xs text-muted-foreground">Ctrl+Alt+←→</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-foreground">{getRootNoteName()}</div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTranspose(Math.max(-11, transpose - 1))}
                    disabled={transpose <= -11}
                    className="glass-card hover-lift h-8 w-8 p-0 text-sm"
                  >
                    -
                  </Button>
                  <div className="text-center">
                    <div className="font-mono text-sm font-semibold text-foreground">
                      {transpose > 0 ? `+${transpose}` : transpose}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTranspose(Math.min(11, transpose + 1))}
                    disabled={transpose >= 11}
                    className="glass-card hover-lift h-8 w-8 p-0 text-sm"
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Octave Control */}
          <Card className="glass-card glass-card-hover hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-primary p-2 shadow-sm">
                  <FaArrowUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Octave</div>
                  <div className="text-xs text-muted-foreground">Ctrl+Alt+↑↓</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-semibold text-foreground">{currentOctave}</div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentOctave(Math.max(0, currentOctave - 1))}
                    disabled={currentOctave <= 0}
                    className="glass-card hover-lift h-8 w-8 p-0 text-sm"
                  >
                    -
                  </Button>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">0-6</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentOctave(Math.min(6, currentOctave + 1))}
                    disabled={currentOctave >= 6}
                    className="glass-card hover-lift h-8 w-8 p-0 text-sm"
                  >
                    +
                  </Button>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  {currentOctave <= 2 ? "Lower" : currentOctave >= 5 ? "Higher" : "Middle"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Reeds Control */}
          <Card className="glass-card glass-card-hover hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-primary p-2 shadow-sm">
                  <FaPlus className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Reeds</div>
                  <div className="text-xs text-muted-foreground">Ctrl+Alt+±</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-semibold text-foreground">{additionalReeds}</div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAdditionalReeds(Math.max(0, additionalReeds - 1))}
                    disabled={additionalReeds <= 0}
                    className="glass-card hover-lift h-8 w-8 p-0 text-sm"
                  >
                    -
                  </Button>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Layers</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAdditionalReeds(Math.min(6 - currentOctave, additionalReeds + 1))}
                    disabled={currentOctave + additionalReeds >= 6}
                    className="glass-card hover-lift h-8 w-8 p-0 text-sm"
                  >
                    +
                  </Button>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  {additionalReeds === 0 ? "Pure" : additionalReeds <= 2 ? "Rich" : "Complex"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Harmonium Information Section */}
        <section className="mb-8 sm:mb-12">
          <div className="minimal-section p-6 sm:p-8">
            <div className="mb-8 text-center">
              <h2 className="mb-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
                About the Harmonium
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
                The harmonium is a free-reed organ that generates sound as air flows past vibrating reeds, essential in
                Indian classical and devotional music.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="glass-card glass-card-hover hover-lift rounded-xl p-6">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-sm">
                    <FaBookOpen className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">History & Origin</h3>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  The harmonium was invented in France around 1840 by Alexandre Debain. It was brought to India during
                  British rule and quickly integrated into Indian music. Despite early criticism, it became a key
                  instrument in classical and devotional genres.
                </p>
              </div>

              <div className="glass-card glass-card-hover hover-lift rounded-xl p-6">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-sm">
                    <FaGear className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Mechanism</h3>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Air is pumped through bellows and flows past metal reeds of different lengths, creating distinct
                  pitches. The keyboard controls which reeds vibrate to produce harmonious sounds.
                </p>
              </div>

              <div className="glass-card glass-card-hover hover-lift rounded-xl p-6">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-sm">
                    <FaUsers className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Usage</h3>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Essential in Indian classical music, bhajans, qawwali, and folk music. One hand operates bellows while
                  the other plays melodies on the keyboard for authentic performances.
                </p>
              </div>

              <div className="glass-card glass-card-hover hover-lift rounded-xl p-6">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-sm">
                    <FaAward className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Cultural Impact</h3>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Revolutionized Indian music by providing a portable, versatile accompaniment instrument. Now integral
                  to classical concerts, devotional music, and modern fusion performances.
                </p>
              </div>
            </div>

            {/* Progressive Disclosure: Additional Information */}
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <details className="glass-card group rounded-xl p-4" open>
                <summary className="flex list-none cursor-pointer items-center justify-between gap-3 text-lg font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-sm">
                    <FaInfo className="h-4 w-4 text-white" />
                  </span>
                  Technical Specs
                  </span>
                  <span className="text-sm text-muted-foreground transition-transform duration-200 group-open:rotate-180">⌄</span>
                </summary>
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <li>• 3-4 octave keyboard range</li>
                  <li>• Free reed sound production</li>
                  <li>• Hand-operated bellows system</li>
                  <li>• Multiple stop combinations</li>
                  <li>• Portable wooden construction</li>
                </ul>
              </details>

              <details className="glass-card group rounded-xl p-4">
                <summary className="flex list-none cursor-pointer items-center justify-between gap-3 text-lg font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-sm">
                    <FaHeadphones className="h-4 w-4 text-white" />
                  </span>
                  Playing Tips
                  </span>
                  <span className="text-sm text-muted-foreground transition-transform duration-200 group-open:rotate-180">⌄</span>
                </summary>
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <li>• Use headphones for best experience</li>
                  <li>• Practice with both hands coordination</li>
                  <li>• Start with simple melodies</li>
                  <li>• Learn basic ragas first</li>
                  <li>• Use MIDI keyboard for advanced play</li>
                </ul>
              </details>

              <details className="glass-card group rounded-xl p-4">
                <summary className="flex list-none cursor-pointer items-center justify-between gap-3 text-lg font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-sm">
                    <FaArrowRotateLeft className="h-4 w-4 text-white" />
                  </span>
                  Learning Path
                  </span>
                  <span className="text-sm text-muted-foreground transition-transform duration-200 group-open:rotate-180">⌄</span>
                </summary>
                <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <li>• Master basic Sargam notes</li>
                  <li>• Practice scale exercises daily</li>
                  <li>• Learn popular bhajans</li>
                  <li>• Study classical ragas</li>
                  <li>• Develop improvisation skills</li>
                </ul>
              </details>
            </div>
          </div>
        </section>

        {/* Enhanced Social Media Footer */}
        <footer className="minimal-section rounded-2xl p-6 sm:rounded-3xl sm:p-8">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
            {/* Website Info */}
            <div className="text-center lg:text-left">
              <div className="mb-4 flex items-center justify-center gap-3 lg:justify-start">
                <div className="rounded-xl bg-primary p-3 shadow-sm">
                  <FaMusic className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-foreground">
                  Web Harmonium
                </h3>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                Professional digital harmonium experience bringing traditional Indian classical music to the modern web
                with authentic sounds and interactive learning.
              </p>
              <div className="text-xs text-muted-foreground">© 2025 Dhruv Akbari. All rights reserved.</div>
            </div>

            {/* Enhanced Social Links */}
            <div className="text-center">
              <h4 className="mb-4 text-lg font-semibold text-foreground">Connect with Developer</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    href: "https://github.com/mrakbari91",
                    icon: FaGithub,
                    label: "GitHub",
                  },
                  {
                    href: "https://www.linkedin.com/in/dhruvakbari",
                    icon: FaLinkedin,
                    label: "LinkedIn",
                  },
                  {
                    href: "https://www.instagram.com/1bari_91/",
                    icon: FaInstagram,
                    label: "Instagram",
                  },
                  {
                    href: "https://www.facebook.com/dhruvakbari91",
                    icon: FaFacebook,
                    label: "Facebook",
                  },
                  {
                    href: "https://x.com/mr_akbari_",
                    icon: FaTwitter,
                    label: "X",
                  },
                  {
                    href: "https://dhruvakbari.vercel.app",
                    icon: FaGlobe,
                    label: "Website",
                  },
                  {
                    href: "https://codepen.io/dhruvakbari/",
                    icon: FaCodepen,
                    label: "CodePen",
                  },
                  {
                    href: "mailto:dhruvakbari303@gmail.com",
                    icon: FaEnvelope,
                    label: "Email",
                  },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group hover-lift rounded-xl border border-border/80 bg-background p-4 text-center text-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-secondary/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    title={social.label}
                  >
                    <social.icon className="mx-auto h-6 w-6 text-primary transition-transform duration-200 group-hover:scale-110" />
                    <div className="mt-2 text-xs font-semibold">{social.label}</div>
                  </a>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="text-center lg:text-right">
              <h4 className="mb-4 text-lg font-semibold text-foreground">Built With</h4>
              <div className="flex flex-wrap justify-center gap-2 lg:justify-end">
                {[
                  { name: "Next.js 15" },
                  { name: "TypeScript" },
                  { name: "Tailwind CSS" },
                  { name: "Web Audio API" },
                  { name: "WebMIDI API" },
                ].map((tech, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="border-border/80 bg-secondary/70 p-2 px-3 text-sm text-foreground"
                  >
                    {tech.name}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Crafted with ❤️ by <span className="font-semibold">Dhruv Akbari</span>
                <br />
                Full Stack Developer & Music Technology Enthusiast
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

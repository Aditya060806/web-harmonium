"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FaMusic, FaWandMagicSparkles, FaStar, FaBolt } from "react-icons/fa6"
import { FaHome, FaSearch} from "react-icons/fa"
import Link from "next/link"

export default function NotFound() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main 404 Card */}
          <Card className="glass-card mb-8 rounded-3xl border p-12 sm:p-16">
            {/* Animated 404 Display */}
            <div className="relative mb-12">
              <div className="mb-6 font-serif text-8xl font-semibold text-foreground sm:text-9xl">
                404
              </div>

              {/* Floating musical icons around 404 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {[FaMusic, FaStar, FaWandMagicSparkles, FaBolt].map((Icon, i) => (
                    <div
                      key={i}
                      className="absolute animate-bounce"
                      style={{
                        left: `${20 + i * 20}%`,
                        top: `${30 + (i % 2) * 40}%`,
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: `${2 + i * 0.3}s`,
                      }}
                    >
                      <div className="rounded-xl bg-primary p-3 opacity-80 shadow-sm">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-12">
              <h1 className="mb-6 font-serif text-4xl font-semibold text-foreground sm:text-6xl">
                Oops! Page Not Found
              </h1>
              <p className="mb-6 text-xl font-medium leading-relaxed text-muted-foreground sm:text-2xl">
                Looks like this harmonium key doesn't exist! 🎹
              </p>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
                The page you're looking for might have been moved, deleted, or perhaps you played the wrong note. Let's
                get you back to making beautiful music!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Link href="/">
                <Button
                  size="lg"
                  className="rounded-2xl px-10 py-4 text-xl font-semibold"
                >
                  <FaHome className="h-6 w-6 mr-3" />
                  Back to Harmonium
                </Button>
              </Link>

              <a
                href="mailto:dhruvakbari303@gmail.com"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-foreground shadow-sm transition-all hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Contact support
              </a>
            </div>

          </Card>

          {/* Additional Help Card */}
          <Card className="glass-card rounded-3xl border p-8">
            <h3 className="mb-6 flex items-center justify-center gap-3 font-serif text-2xl font-semibold text-foreground">
              <div className="rounded-xl bg-primary p-3 shadow-sm">
                <FaSearch className="h-8 w-8 text-white" />
              </div>
              Need Help?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary p-4 shadow-sm">
                  <FaMusic className="h-8 w-8 text-white" />
                </div>
                <h4 className="mb-2 text-lg font-semibold text-foreground">Play Harmonium</h4>
                <p className="text-sm text-muted-foreground">
                  Experience authentic Indian classical music with our digital harmonium
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary p-4 shadow-sm">
                  <FaWandMagicSparkles className="h-8 w-8 text-white" />
                </div>
                <h4 className="mb-2 text-lg font-semibold text-foreground">Learn Music</h4>
                <p className="text-sm text-muted-foreground">
                  Discover Sargam notation, ragas, and traditional playing techniques
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary p-4 shadow-sm">
                  <FaBolt className="h-8 w-8 text-white" />
                </div>
                <h4 className="mb-2 text-lg font-semibold text-foreground">Advanced Features</h4>
                <p className="text-sm text-muted-foreground">
                  MIDI support, keyboard shortcuts, and professional audio controls
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

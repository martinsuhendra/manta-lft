"use client";

import Link from "next/link";

import { Activity, Flame, MapPin, Timer, Trophy, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";

const HERO_BG_IMAGE = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80";
const HERO_VISUAL_IMAGE = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80";

export function LandingHero() {
  return (
    <div className="relative flex min-h-[85dvh] items-center overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32">
      {/* Dynamic Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- hero background from config */}
        <img
          src={HERO_BG_IMAGE}
          alt="Crossfit Gym Background"
          className="h-full w-full object-cover opacity-20 contrast-125 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/90 to-[var(--primary)]/10 mix-blend-multiply" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center lg:text-left">
        <div className="flex flex-col items-center justify-between gap-12 lg:flex-row">
          <div className="space-y-8 lg:w-1/2">
            <div className="animate-fade-in-up border-primary/30 bg-primary/10 text-primary inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium backdrop-blur-sm">
              <span className="bg-primary mr-2 flex h-2 w-2 animate-pulse rounded-full" />
              New Hyrox Season Starts Now
            </div>
            <h1 className="animate-fade-in-up text-foreground text-4xl leading-tight font-black tracking-tighter drop-shadow-2xl sm:text-5xl md:text-7xl md:leading-[0.9]">
              DIVE INTO <br />
              <span className="from-primary bg-gradient-to-r to-orange-400 bg-clip-text text-transparent">
                ELITE
              </span>{" "}
              <br />
              PERFORMANCE
            </h1>
            <p className="text-muted-foreground animate-fade-in-up mx-auto max-w-xl text-base leading-relaxed delay-100 sm:text-xl lg:mx-0">
              The premier facility for Crossfit and Hyrox training. Join the {APP_CONFIG.name} community. Push limits,
              break barriers, and sweat together.
            </p>
            <div className="animate-fade-in-up flex flex-col items-center justify-center gap-4 delay-200 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="h-12 w-full text-base font-bold tracking-wide uppercase sm:w-auto">
                <Link href="#schedule">View Schedule</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 w-full text-base sm:w-auto">
                <Link href="#plans">Start Free Trial</Link>
              </Button>
            </div>

            <div className="text-muted-foreground animate-fade-in-up flex flex-wrap items-center justify-center gap-8 pt-8 text-sm font-medium delay-300 lg:justify-start">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" /> 500+ Members
              </span>
              <span className="flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Certified Coaches
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {APP_CONFIG.name}
              </span>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="perspective-1000 relative hidden lg:block lg:w-1/2">
            <div className="hero-visual-card group border-border bg-card shadow-primary/20 relative aspect-video overflow-hidden rounded-2xl border shadow-2xl">
              <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- hero visual from config */}
                <img
                  src={HERO_VISUAL_IMAGE}
                  alt="Athlete Training"
                  className="h-full w-full object-cover opacity-60 transition-opacity duration-700 group-hover:opacity-80"
                />
              </div>
              <div className="from-background absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-90" />

              <div className="absolute bottom-6 left-6 z-10">
                <div className="mb-2 flex items-center gap-3">
                  <Activity className="text-primary h-6 w-6" />
                  <span className="text-lg font-black tracking-widest text-white uppercase">
                    {APP_CONFIG.name} Performance
                  </span>
                </div>
                <p className="max-w-xs text-sm text-gray-300">
                  High intensity functional training for the modern athlete.
                </p>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="animate-bounce-slow border-border bg-card/90 absolute -bottom-6 -left-6 flex items-center gap-4 rounded-xl border p-4 shadow-xl backdrop-blur-md">
              <div className="rounded-lg bg-orange-500/20 p-2 text-orange-500">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-bold uppercase">Calories Burned</p>
                <p className="text-foreground text-lg font-bold">850 kcal</p>
              </div>
            </div>

            <div className="border-border bg-card/90 absolute -top-6 -right-6 flex animate-pulse items-center gap-4 rounded-xl border p-4 shadow-xl backdrop-blur-md">
              <div className="bg-primary/20 text-primary rounded-lg p-2">
                <Timer className="h-6 w-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-bold uppercase">Time Cap</p>
                <p className="text-foreground text-lg font-bold">45:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

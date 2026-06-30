import Image from "next/image";
import Link from "next/link";

import { Activity, Flame, MapPin, Timer, Trophy, Users } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";
import { cn } from "@/lib/utils";

const HERO_VISUAL_IMAGE = "/images/hero-visual.jpg";

export function LandingHero() {
  return (
    <div className="relative flex min-h-[85dvh] items-center overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32">
      <div className="hero-wavy-white absolute inset-0 z-0" aria-hidden />

      <div className="relative z-10 container mx-auto px-4 text-center lg:text-left">
        <div className="flex flex-col items-center justify-between gap-12 lg:flex-row">
          <div className="space-y-8 lg:w-1/2">
            <div className="animate-fade-in-up border-primary/30 bg-primary/10 text-primary inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
              <span className="bg-primary mr-2 flex h-2 w-2 animate-pulse rounded-full" />
              New Hyrox Season Starts Now
            </div>
            <h1 className="text-brand-accent text-4xl leading-tight font-black tracking-tighter sm:text-5xl md:text-7xl md:leading-[0.9]">
              DIVE INTO <br />
              <span className="from-primary bg-gradient-to-r to-orange-400 bg-clip-text text-transparent">
                ELITE
              </span>{" "}
              <br />
              PERFORMANCE
            </h1>
            <p className="text-brand-accent/70 animate-fade-in-up mx-auto max-w-xl text-base leading-relaxed delay-100 sm:text-xl lg:mx-0">
              The premier facility for Crossfit and Hyrox training. Join the {APP_CONFIG.name} community. Push limits,
              break barriers, and sweat together.
            </p>
            <div className="animate-fade-in-up flex flex-col items-center justify-center gap-4 delay-200 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="h-12 w-full text-base font-bold tracking-wide uppercase sm:w-auto">
                <Link href="/public/book">Book a Class</Link>
              </Button>
              <Link
                href="#plans"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-brand-accent/20 text-brand-accent hover:bg-brand-accent/5 h-12 w-full text-base sm:w-auto",
                )}
              >
                Start Free Trial
              </Link>
            </div>

            <div className="text-brand-accent/65 animate-fade-in-up flex flex-wrap items-center justify-center gap-8 pt-8 text-sm font-medium delay-300 lg:justify-start">
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

          <div className="perspective-1000 relative hidden lg:block lg:w-1/2">
            <div className="hero-visual-card group border-brand-accent/10 shadow-brand-accent/10 relative aspect-video overflow-hidden rounded-2xl border bg-white shadow-2xl">
              <div className="absolute inset-0">
                <Image
                  src={HERO_VISUAL_IMAGE}
                  alt="Athlete Training"
                  fill
                  sizes="(max-width: 1024px) 0vw, 50vw"
                  className="object-cover opacity-80 transition-opacity duration-700 group-hover:opacity-95"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              <div className="absolute bottom-6 left-6 z-10">
                <div className="mb-2 flex items-center gap-3">
                  <Activity className="text-primary h-6 w-6" />
                  <span className="text-lg font-black tracking-widest text-white uppercase">
                    {APP_CONFIG.name} Performance
                  </span>
                </div>
                <p className="max-w-xs text-sm text-white/85">
                  High intensity functional training for the modern athlete.
                </p>
              </div>
            </div>

            <div className="animate-bounce-slow border-brand-accent/10 absolute -bottom-6 -left-6 flex items-center gap-4 rounded-xl border bg-white p-4 shadow-xl">
              <div className="rounded-lg bg-orange-500/20 p-2 text-orange-500">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <p className="text-brand-accent/60 text-xs font-bold uppercase">Calories Burned</p>
                <p className="text-brand-accent text-lg font-bold">850 kcal</p>
              </div>
            </div>

            <div className="border-brand-accent/10 absolute -top-6 -right-6 flex animate-pulse items-center gap-4 rounded-xl border bg-white p-4 shadow-xl">
              <div className="bg-primary/20 text-primary rounded-lg p-2">
                <Timer className="h-6 w-6" />
              </div>
              <div>
                <p className="text-brand-accent/60 text-xs font-bold uppercase">Time Cap</p>
                <p className="text-brand-accent text-lg font-bold">45:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

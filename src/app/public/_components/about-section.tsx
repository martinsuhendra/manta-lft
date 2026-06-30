"use client";

import Image from "next/image";

import { CheckCircle2 } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

import { SectionWithPattern } from "./section-with-pattern";

const features = [
  "Certified & Experienced Coaches",
  "Community-Focused Environment",
  "Scalable Workouts for All Levels",
  "Nutritional Guidance",
  "Open Gym Access",
  "Regular Community Events",
];

export function AboutSection() {
  return (
    <SectionWithPattern id="about" className="border-border/60 sporty-section-fill-white border-t py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:pt-4">
            <p className="text-brand-primary text-sm font-semibold tracking-widest uppercase">About Us</p>
            <h2 className="text-brand-accent mt-0 text-2xl font-black tracking-tight sm:mt-2 sm:text-3xl md:text-4xl">
              More Than Just a Gym
            </h2>
            <p className="text-brand-accent/70 mt-4 text-base leading-7 sm:mt-6 sm:text-lg sm:leading-8">
              At {APP_CONFIG.name}, we believe in the transformative power of fitness. Our mission is to create a space
              where everyone—from competitive athletes to fitness beginners—can push their limits and achieve their
              goals.
            </p>
            <ul className="mt-8 space-y-4">
              {features.map((feature) => (
                <li key={feature} className="text-brand-accent/80 flex items-start gap-3">
                  <CheckCircle2 className="text-brand-primary mt-0.5 h-5 w-5 shrink-0" />
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-brand-accent/10 shadow-brand-accent/5 relative aspect-[4/3] min-w-0 overflow-hidden rounded-2xl border bg-white shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5"
              alt="Gym interior"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </SectionWithPattern>
  );
}

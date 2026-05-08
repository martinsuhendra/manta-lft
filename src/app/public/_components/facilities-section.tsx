"use client";

import { Dumbbell, LayoutGrid, ShowerHead, Timer, Wifi, Wind } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SectionWithPattern } from "./section-with-pattern";

const facilities = [
  {
    name: "Premium Equipment",
    description: "Top-tier barbells, plates, rigs, and cardio machines from Rogue and Concept2.",
    icon: Dumbbell,
  },
  {
    name: "Spacious Floor",
    description: "4000 sq ft of open workout space with shock-absorbing rubber flooring.",
    icon: LayoutGrid,
  },
  {
    name: "Recovery Zone",
    description: "Dedicated area for mobility, foam rolling, and post-workout stretching.",
    icon: Wind,
  },
  {
    name: "Showers & Lockers",
    description: "Clean, modern changing rooms with hot showers and secure lockers.",
    icon: ShowerHead,
  },
  {
    name: "Competition Timer",
    description: "Professional timing systems for WODs and interval training.",
    icon: Timer,
  },
  {
    name: "Free WiFi & Lounge",
    description: "Relax before or after class with free high-speed internet and comfortable seating.",
    icon: Wifi,
  },
];

export function FacilitiesSection() {
  return (
    <SectionWithPattern className="border-border bg-background border-t py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-2xl font-black tracking-tighter uppercase sm:text-3xl md:text-4xl md:text-5xl">
            World-Class Facilities
          </h2>
          <p className="text-muted-foreground mt-3 text-base sm:mt-4 sm:text-lg">
            Everything you need to perform at your best, all under one roof.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {facilities.map((facility) => (
            <Card
              key={facility.name}
              className="border-border bg-card hover:border-primary/50 hover:shadow-primary/5 transition-all hover:shadow-lg"
            >
              <CardHeader>
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                  <facility.icon className="text-primary h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold tracking-wide uppercase">{facility.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-6">{facility.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SectionWithPattern>
  );
}

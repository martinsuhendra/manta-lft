"use client";

import { Star } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

import { SectionWithPattern } from "./section-with-pattern";

const TESTIMONIALS = [
  {
    name: "Member",
    role: "CrossFit Member",
    text: "The community here is unmatched. The coaches actually focus on your form and help you progress safely.",
  },
  {
    name: "Athlete",
    role: "Competitor",
    text: `The facility is world-class. Training at ${APP_CONFIG.name} helped me reach a new level in my performance.`,
  },
];

export function TestimonialsSection() {
  return (
    <SectionWithPattern className="border-border bg-background sporty-section-fill border-t py-24 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <h2 className="text-foreground text-2xl font-black tracking-tighter uppercase italic sm:text-3xl md:text-4xl">
            Member Results
          </h2>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <div
              key={`${t.name}-${t.role}`}
              className="border-border bg-card hover:border-primary/50 rounded-xl border p-8 text-left transition-all"
            >
              <div className="text-primary mb-4 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 italic">&ldquo;{t.text}&rdquo;</p>
              <div>
                <p className="text-foreground font-bold">{t.name}</p>
                <p className="text-muted-foreground text-xs tracking-wider uppercase">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWithPattern>
  );
}

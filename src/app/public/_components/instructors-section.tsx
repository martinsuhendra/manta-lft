"use client";

import Image from "next/image";

import { User } from "lucide-react";

import { SectionWithPattern } from "./section-with-pattern";

interface Instructor {
  id: string;
  name: string | null;
  image: string | null;
  email: string | null;
  description?: string | null;
}

interface InstructorsSectionProps {
  instructors: Instructor[];
}

export function InstructorsSection({ instructors }: InstructorsSectionProps) {
  if (instructors.length === 0) return null;

  return (
    <SectionWithPattern className="border-border/30 bg-brand-accent sporty-section-fill border-t py-24 sm:py-32">
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="animate-fade-in-up mb-10 text-center sm:mb-16">
          <h2 className="mb-3 text-2xl font-black tracking-tighter text-white uppercase italic sm:mb-4 sm:text-3xl md:text-5xl">
            Elite <span className="text-brand-primary">Coaching</span>
          </h2>
          <p className="text-white/75">Led by regional athletes and certified specialists.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {instructors.map((instructor, i) => (
            <div
              key={instructor.id}
              className="animate-fade-in-up group hover:border-brand-primary/40 relative aspect-[3/4] overflow-hidden rounded-xl border border-white/15 bg-black/20 shadow-lg ring-1 shadow-black/30 ring-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute inset-0">
                {instructor.image ? (
                  <Image
                    src={instructor.image}
                    alt={instructor.name ?? "Coach"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover brightness-90 contrast-105 saturate-75 transition-all duration-700 group-hover:scale-110 group-hover:brightness-100 group-hover:saturate-100"
                  />
                ) : (
                  <div className="from-brand-accent flex h-full w-full items-center justify-center bg-gradient-to-br to-black/60">
                    <User className="h-20 w-20 text-white/40" />
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/5 transition-opacity duration-500 group-hover:from-black/75 group-hover:via-black/20" />

              <div className="absolute right-0 bottom-0 left-0 translate-y-2 p-6 transition-transform duration-300 group-hover:translate-y-0">
                <h3 className="relative inline-block text-xl font-bold text-white uppercase italic drop-shadow-sm">
                  {instructor.name ?? "Coach"}
                  <span className="bg-brand-primary absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                </h3>
                <p className="text-brand-primary mb-1 text-sm font-bold tracking-wide uppercase drop-shadow-sm">
                  Coach
                </p>
                <p className="text-xs font-medium text-white/85 drop-shadow-sm">
                  {instructor.description ?? "Certified specialist"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWithPattern>
  );
}

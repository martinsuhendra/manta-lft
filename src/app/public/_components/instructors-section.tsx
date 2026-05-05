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
    <SectionWithPattern className="border-border bg-muted/20 sporty-section-fill border-t py-24 sm:py-32">
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="animate-fade-in-up mb-10 text-center sm:mb-16">
          <h2 className="text-foreground mb-3 text-2xl font-black tracking-tighter uppercase italic sm:mb-4 sm:text-3xl md:text-5xl">
            Elite Coaching
          </h2>
          <p className="text-muted-foreground">Led by regional athletes and certified specialists.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {instructors.map((instructor, i) => (
            <div
              key={instructor.id}
              className="animate-fade-in-up group bg-secondary relative aspect-[3/4] overflow-hidden rounded-xl shadow-lg transition-all duration-500 hover:shadow-xl"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="absolute inset-0">
                {instructor.image ? (
                  <Image
                    src={instructor.image}
                    alt={instructor.name ?? "Coach"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover grayscale transition-transform duration-700 group-hover:scale-110 group-hover:grayscale-0"
                  />
                ) : (
                  <div className="bg-muted flex h-full w-full items-center justify-center">
                    <User className="text-muted-foreground h-20 w-20" />
                  </div>
                )}
              </div>

              <div className="from-background via-background/20 absolute inset-0 bg-gradient-to-t to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-60" />

              <div className="absolute right-0 bottom-0 left-0 translate-y-2 p-6 transition-transform duration-300 group-hover:translate-y-0">
                <h3 className="text-foreground relative inline-block text-xl font-bold uppercase italic">
                  {instructor.name ?? "Coach"}
                  <span className="bg-primary absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                </h3>
                <p className="text-primary mb-1 text-sm font-bold tracking-wide uppercase">Coach</p>
                <p className="text-muted-foreground text-xs font-medium">
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

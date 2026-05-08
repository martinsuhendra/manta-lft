"use client";

import { cn } from "@/lib/utils";

interface SectionWithPatternProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  /** Section tag (default: section) */
  as?: "section" | "div";
}

export function SectionWithPattern({
  children,
  as: Component = "section",
  className,
  ...props
}: SectionWithPatternProps) {
  return (
    <Component className={cn("relative overflow-hidden", className)} {...props}>
      {children}
    </Component>
  );
}

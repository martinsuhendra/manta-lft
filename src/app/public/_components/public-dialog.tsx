"use client";

import * as React from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const publicDialogShellClassName =
  "gap-0 overflow-hidden border-white/15 p-0 [&_[data-slot=dialog-close]]:text-white/80 [&_[data-slot=dialog-close]]:top-5 [&_[data-slot=dialog-close]]:right-5 [&_[data-slot=dialog-close]]:hover:text-white [&_[data-slot=dialog-close]]:data-[state=open]:bg-white/10 [&_[data-slot=dialog-close]]:data-[state=open]:text-white";

const publicDialogFieldClassName =
  "[&_[data-slot=form-control]]:!border-brand-accent/20 [&_[data-slot=form-control]]:!bg-brand-accent/[0.06] [&_[data-slot=form-control]]:!text-brand-accent [&_[data-slot=form-control]]:placeholder:!text-brand-accent/45 [&_[data-slot=form-control]]:shadow-none [&_[data-slot=form-control]]:focus-visible:!border-brand-primary [&_[data-slot=form-control]]:focus-visible:ring-brand-primary/25 [&_[data-slot=form-control]]:dark:!border-brand-accent/20 [&_[data-slot=form-control]]:dark:!bg-brand-accent/[0.06] [&_[data-slot=input]]:!border-brand-accent/20 [&_[data-slot=input]]:!bg-brand-accent/[0.06] [&_[data-slot=input]]:!text-brand-accent [&_[data-slot=input]]:placeholder:!text-brand-accent/45 [&_[data-slot=input]]:dark:!border-brand-accent/20 [&_[data-slot=input]]:dark:!bg-brand-accent/[0.06] [&_textarea]:!border-brand-accent/20 [&_textarea]:!bg-brand-accent/[0.06] [&_textarea]:!text-brand-accent [&_textarea]:placeholder:!text-brand-accent/45 [&_textarea]:dark:!bg-brand-accent/[0.06] [&_[data-slot=select-trigger]]:!border-brand-accent/20 [&_[data-slot=select-trigger]]:!bg-brand-accent/[0.06] [&_[data-slot=select-trigger]]:!text-brand-accent [&_[data-slot=select-trigger]]:dark:!bg-brand-accent/[0.06]";

const publicDialogBodyClassName = cn(
  "bg-white text-brand-accent",
  "[&_label]:text-brand-accent/90",
  publicDialogFieldClassName,
  "[&_button.border]:!border-brand-accent/20 [&_button.border]:!bg-brand-accent/[0.06] [&_button.border]:!text-brand-accent [&_button.border]:hover:!bg-brand-accent/10",
  "[&_.text-muted-foreground]:text-brand-accent/65 [&_.text-foreground]:text-brand-accent [&_.bg-muted]:border-brand-accent/10 [&_.bg-muted]:bg-brand-accent/[0.06] [&_.rounded-md.border]:border-brand-accent/15 [&_.prose]:text-brand-accent/80 [&_.prose_h1]:text-brand-accent [&_.prose_h2]:text-brand-accent [&_.prose_h3]:text-brand-accent [&_.prose_strong]:text-brand-accent [&_a]:text-brand-primary [&_a:hover]:text-brand-primary/80",
);

const publicDialogFooterClassName =
  "bg-brand-accent border-white/10 flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end [&_button.border]:border-white/25 [&_button.border]:bg-transparent [&_button.border]:text-white [&_button.border]:hover:bg-white/10";

function PublicDialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent className={cn(publicDialogShellClassName, className)} {...props}>
      <div className="flex flex-col">{children}</div>
    </DialogContent>
  );
}

function PublicDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="public-dialog-header"
      className={cn("bg-brand-accent border-b border-white/10 px-6 pt-6 pr-12 pb-4", className)}
      {...props}
    />
  );
}

function PublicDialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="public-dialog-body" className={cn("px-6 py-5", publicDialogBodyClassName, className)} {...props} />
  );
}

function PublicDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="public-dialog-footer" className={cn(publicDialogFooterClassName, className)} {...props} />;
}

function PublicDialogTitle({ className, ...props }: React.ComponentProps<typeof DialogTitle>) {
  return <DialogTitle className={cn("text-lg leading-none font-semibold text-white", className)} {...props} />;
}

function PublicDialogDescription({ className, ...props }: React.ComponentProps<typeof DialogDescription>) {
  return <DialogDescription className={cn("text-sm text-white/70", className)} {...props} />;
}

export {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogTrigger,
  PublicDialogBody,
  PublicDialogContent,
  PublicDialogDescription,
  PublicDialogFooter,
  PublicDialogHeader,
  PublicDialogTitle,
  publicDialogFieldClassName,
};

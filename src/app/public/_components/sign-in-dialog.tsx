"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogTrigger,
  PublicDialogBody,
  PublicDialogContent,
  PublicDialogDescription,
  PublicDialogFooter,
  PublicDialogHeader,
  PublicDialogTitle,
} from "./public-dialog";

const FormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

interface SignInDialogProps {
  children?: React.ReactNode;
  /** When provided, dialog is controlled by parent (use when trigger is outside, e.g. dropdown item) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SignInDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SignInDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials", {
          description: "Please check your email and password and try again.",
        });
      } else if (result?.ok) {
        toast.success("Successfully signed in!");
        setIsOpen(false);
        form.reset();
        router.push("/public/my-account");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const dialogContent = (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children != null ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <PublicDialogContent>
        <PublicDialogHeader>
          <PublicDialogTitle>Sign in to your account</PublicDialogTitle>
          <PublicDialogDescription>Enter your credentials to access your account.</PublicDialogDescription>
        </PublicDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <PublicDialogBody className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-brand-primary hover:text-brand-primary/80 text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Forgot your password?
                </Link>
              </div>
            </PublicDialogBody>
            <PublicDialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </PublicDialogFooter>
          </form>
        </Form>
      </PublicDialogContent>
    </Dialog>
  );

  return dialogContent;
}

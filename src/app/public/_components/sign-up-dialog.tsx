"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpFormSchema } from "@/lib/validators";

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

interface PublicWaiverResponse {
  contentHtml: string;
  version: number;
  isActive: boolean;
}

interface SignUpDialogProps {
  children: React.ReactNode;
}

export function SignUpDialog({ children }: SignUpDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isWaiverDialogOpen, setIsWaiverDialogOpen] = useState(false);
  const [isWaiverConfirmed, setIsWaiverConfirmed] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState<z.infer<typeof signUpFormSchema> | null>(null);
  const [waiver, setWaiver] = useState<PublicWaiverResponse | null>(null);
  const [isWaiverLoading, setIsWaiverLoading] = useState(true);
  const router = useRouter();

  const form = useForm<z.infer<typeof signUpFormSchema>>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNo: "",
      emergencyContact: "",
      emergencyContactName: "",
      birthday: "",
      waiverVersion: 1,
      acceptWaiver: true,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function loadWaiver() {
      try {
        const response = await fetch("/api/public/waiver");
        if (!response.ok) throw new Error("Failed to load waiver");
        const data = (await response.json()) as PublicWaiverResponse;
        if (!isMounted) return;
        setWaiver(data);
        form.setValue("waiverVersion", data.version, { shouldValidate: true });
        form.setValue("acceptWaiver", true, { shouldValidate: true });
      } catch {
        if (!isMounted) return;
        toast.error("Failed to load waiver");
      } finally {
        if (isMounted) setIsWaiverLoading(false);
      }
    }

    void loadWaiver();
    return () => {
      isMounted = false;
    };
  }, [form]);

  const submitRegistration = async (data: z.infer<typeof signUpFormSchema>) => {
    setIsLoading(true);
    try {
      // Register user
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phoneNo: data.phoneNo,
          emergencyContact: data.emergencyContact,
          emergencyContactName: data.emergencyContactName,
          birthday: data.birthday,
          waiverVersion: data.waiverVersion,
          acceptWaiver: data.acceptWaiver,
          password: data.password,
        }),
      });

      const registerResult = await registerResponse.json();

      if (!registerResponse.ok) {
        toast.error("Registration failed", {
          description: registerResult.error ?? "Something went wrong during registration.",
        });
        return;
      }

      // Auto sign-in after successful registration
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.error("Registration successful but sign-in failed", {
          description: "Please try signing in manually.",
        });
        setIsOpen(false);
      } else if (signInResult?.ok) {
        toast.success("Account created successfully!", {
          description: "Welcome! You have been automatically signed in.",
        });
        setIsOpen(false);
        form.reset();
        router.push("/public");
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

  const onSubmit = async (data: z.infer<typeof signUpFormSchema>) => {
    if (!waiver?.isActive) {
      await submitRegistration(data);
      return;
    }

    setPendingRegistrationData(data);
    setIsWaiverConfirmed(false);
    setIsWaiverDialogOpen(true);
  };

  const handleConfirmWaiverAndRegister = async () => {
    if (!pendingRegistrationData) return;
    if (!isWaiverConfirmed) {
      toast.error("You must agree to the waiver to continue");
      return;
    }

    await submitRegistration({
      ...pendingRegistrationData,
      acceptWaiver: true,
      waiverVersion: waiver?.version ?? pendingRegistrationData.waiverVersion,
    });

    setIsWaiverDialogOpen(false);
    setPendingRegistrationData(null);
    setIsWaiverConfirmed(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <PublicDialogContent className="max-h-[90vh] sm:max-w-xl">
          <PublicDialogHeader>
            <PublicDialogTitle>Create your account</PublicDialogTitle>
            <PublicDialogDescription>Enter your details to register as a member.</PublicDialogDescription>
          </PublicDialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <PublicDialogBody className="max-h-[55vh] space-y-4 overflow-y-auto">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input id="name" type="text" placeholder="John Doe" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  name="phoneNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input id="phoneNo" type="tel" placeholder="+1234567890" autoComplete="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Name</FormLabel>
                      <FormControl>
                        <Input
                          id="emergencyContactName"
                          type="text"
                          placeholder="Jane Doe"
                          autoComplete="name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact</FormLabel>
                      <FormControl>
                        <Input
                          id="emergencyContact"
                          type="tel"
                          placeholder="+1234567890"
                          autoComplete="tel-national"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birthday</FormLabel>
                      <FormControl>
                        <BirthdayPicker
                          ref={field.ref}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Pick your birthday"
                        />
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
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="waiverVersion"
                  render={({ field }) => <input type="hidden" value={field.value} readOnly />}
                />
                <FormField
                  control={form.control}
                  name="acceptWaiver"
                  render={({ field }) => <input type="hidden" value={String(field.value)} readOnly />}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </PublicDialogBody>
              <PublicDialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isWaiverLoading}>
                  {isLoading || isWaiverLoading ? "Preparing..." : "Register"}
                </Button>
              </PublicDialogFooter>
            </form>
          </Form>
        </PublicDialogContent>
      </Dialog>

      <Dialog
        open={isWaiverDialogOpen}
        onOpenChange={(open) => {
          if (isLoading) return;
          setIsWaiverDialogOpen(open);
          if (!open) setIsWaiverConfirmed(false);
        }}
      >
        <PublicDialogContent className="max-w-2xl">
          <PublicDialogHeader>
            <PublicDialogTitle>Waiver and release of liability</PublicDialogTitle>
            <PublicDialogDescription>
              Please review and agree to the waiver to complete your registration.
            </PublicDialogDescription>
          </PublicDialogHeader>

          <PublicDialogBody className="space-y-4">
            <div className="max-h-[55vh] overflow-y-auto rounded-md border p-4">
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: waiver?.contentHtml ?? "" }} />
              </div>
            </div>

            <div className="rounded-md border p-3">
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <Checkbox
                  checked={isWaiverConfirmed}
                  onCheckedChange={(value) => setIsWaiverConfirmed(Boolean(value))}
                />
                <span>I have read this waiver and voluntarily agree to its terms.</span>
              </label>
            </div>
          </PublicDialogBody>

          <PublicDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsWaiverDialogOpen(false);
                setIsWaiverConfirmed(false);
              }}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button type="button" onClick={handleConfirmWaiverAndRegister} disabled={isLoading || !isWaiverConfirmed}>
              {isLoading ? "Creating account..." : "Agree and create account"}
            </Button>
          </PublicDialogFooter>
        </PublicDialogContent>
      </Dialog>
    </>
  );
}

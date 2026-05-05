"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { shouldRedirectToDashboardAfterAuth } from "@/lib/rbac";
import { signUpFormSchema } from "@/lib/validators";

interface PublicWaiverResponse {
  contentHtml: string;
  version: number;
  isActive: boolean;
}

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
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
      acceptWaiver: false,
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
        if (!data.isActive) form.setValue("acceptWaiver", true, { shouldValidate: true });
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

  const onSubmit = async (data: z.infer<typeof signUpFormSchema>) => {
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
        router.push("/sign-in");
      } else if (signInResult?.ok) {
        toast.success("Account created successfully!", {
          description: "Welcome! You have been automatically signed in.",
        });
        // Wait a bit for session to be available, then get it to check user role
        await new Promise((resolve) => setTimeout(resolve, 100));
        const session = await getSession();
        const role = session?.user.role;
        const redirectPath = shouldRedirectToDashboardAfterAuth(role) ? "/dashboard/home" : "/public";
        router.push(redirectPath);
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          name="emergencyContactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact Name</FormLabel>
              <FormControl>
                <Input id="emergencyContactName" type="text" placeholder="Jane Doe" autoComplete="name" {...field} />
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
                <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
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
        {waiver?.isActive ? (
          <>
            <FormField
              control={form.control}
              name="waiverVersion"
              render={({ field }) => <input type="hidden" value={field.value} readOnly />}
            />
            <div className="max-h-56 overflow-y-auto rounded-md border p-3 text-sm">
              <div dangerouslySetInnerHTML={{ __html: waiver.contentHtml }} />
            </div>
            <FormField
              control={form.control}
              name="acceptWaiver"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(Boolean(value))} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I agree to this waiver and release of liability</FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </>
        ) : null}
        <Button className="w-full" type="submit" disabled={isLoading || isWaiverLoading}>
          {isLoading || isWaiverLoading ? "Creating account..." : "Register"}
        </Button>
      </form>
    </Form>
  );
}

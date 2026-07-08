"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { usePublicWaiver } from "@/hooks/use-public-waiver";
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
import { SignUpFormFields } from "./sign-up-form-fields";
import { SignUpWaiverDialog } from "./sign-up-waiver-dialog";

interface SignUpDialogProps {
  children: React.ReactNode;
}

export function SignUpDialog({ children }: SignUpDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isWaiverDialogOpen, setIsWaiverDialogOpen] = useState(false);
  const [isWaiverConfirmed, setIsWaiverConfirmed] = useState(false);
  const [pendingRegistrationData, setPendingRegistrationData] = useState<z.infer<typeof signUpFormSchema> | null>(null);
  const router = useRouter();
  const {
    data: waiverData,
    isLoading: isWaiverLoading,
    isError: isWaiverError,
  } = usePublicWaiver(isOpen || isWaiverDialogOpen);
  const activeWaivers = useMemo(
    () => waiverData?.waivers.filter((waiver) => waiver.isActive) ?? [],
    [waiverData?.waivers],
  );

  const form = useForm<z.infer<typeof signUpFormSchema>>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNo: "",
      emergencyContact: "",
      emergencyContactName: "",
      birthday: "",
      waiverAcceptances: [],
      acceptWaiver: true,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (activeWaivers.length === 0) return;
    form.setValue(
      "waiverAcceptances",
      activeWaivers.map((waiver) => ({ waiverId: waiver.id, version: waiver.version })),
      { shouldValidate: true },
    );
    form.setValue("acceptWaiver", true, { shouldValidate: true });
  }, [activeWaivers, form]);

  useEffect(() => {
    if (isWaiverError) toast.error("Failed to load waiver");
  }, [isWaiverError]);

  const submitRegistration = async (data: z.infer<typeof signUpFormSchema>) => {
    setIsLoading(true);
    try {
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
          waiverAcceptances: data.waiverAcceptances,
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
    if (activeWaivers.length === 0) {
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
      waiverAcceptances: activeWaivers.map((waiver) => ({ waiverId: waiver.id, version: waiver.version })),
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
                <SignUpFormFields control={form.control} />
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

      <SignUpWaiverDialog
        open={isWaiverDialogOpen}
        isLoading={isLoading}
        waivers={activeWaivers}
        isWaiverConfirmed={isWaiverConfirmed}
        onOpenChange={(open) => {
          if (isLoading) return;
          setIsWaiverDialogOpen(open);
          if (!open) setIsWaiverConfirmed(false);
        }}
        onWaiverConfirmedChange={setIsWaiverConfirmed}
        onBack={() => {
          setIsWaiverDialogOpen(false);
          setIsWaiverConfirmed(false);
        }}
        onConfirm={handleConfirmWaiverAndRegister}
      />
    </>
  );
}

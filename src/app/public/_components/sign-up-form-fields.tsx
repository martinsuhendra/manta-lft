"use client";

import type { Control } from "react-hook-form";
import type { z } from "zod";

import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { signUpFormSchema } from "@/lib/validators";

interface SignUpFormFieldsProps {
  control: Control<z.infer<typeof signUpFormSchema>>;
}

export function SignUpFormFields({ control }: SignUpFormFieldsProps) {
  return (
    <>
      <FormField
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
        name="waiverAcceptances"
        render={({ field }) => <input type="hidden" value={JSON.stringify(field.value)} readOnly />}
      />
      <FormField
        control={control}
        name="acceptWaiver"
        render={({ field }) => <input type="hidden" value={String(field.value)} readOnly />}
      />
      <FormField
        control={control}
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
    </>
  );
}

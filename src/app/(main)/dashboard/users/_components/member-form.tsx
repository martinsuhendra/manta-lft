/* eslint-disable complexity, @typescript-eslint/no-unnecessary-condition */
"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cloudinaryAssetSchema } from "@/lib/cloudinary-asset";
import { CLOUDINARY_UPLOAD_TARGETS } from "@/lib/cloudinary-validation";
import { USER_ROLES, USER_ROLE_LABELS, DEFAULT_USER_ROLE } from "@/lib/types";

import { getAvailableRoles } from "./member-detail-drawer-utils";
import { Member } from "./schema";

/** `YYYY-MM-DD` for birthday picker / API ISO or date-only strings. */
function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    role: z
      .enum([USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER, USER_ROLES.MEMBER, USER_ROLES.TEACHER])
      .default(DEFAULT_USER_ROLE),
    phoneNo: z
      .string()
      .min(1, "Phone number is required")
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must be at most 15 digits")
      .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
    emergencyContact: z
      .string()
      .min(10, "Emergency contact must be at least 10 digits")
      .max(15, "Emergency contact must be at most 15 digits")
      .regex(/^[0-9+\-\s()]+$/, "Invalid emergency contact format"),
    emergencyContactName: z.string().min(1, "Emergency contact name is required"),
    birthday: z.string().min(1, "Birthday is required"),
    image: z.string().nullable().optional(),
    avatarAsset: cloudinaryAssetSchema.nullable().optional(),
    bio: z.string().max(2000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (normalizePhoneNumber(data.phoneNo) === normalizePhoneNumber(data.emergencyContact)) {
      ctx.addIssue({
        code: "custom",
        message: "Emergency contact must be different from phone number",
        path: ["emergencyContact"],
      });
    }

    const t = new Date(`${data.birthday}T12:00:00.000Z`).getTime();
    if (Number.isNaN(t)) {
      ctx.addIssue({ code: "custom", message: "Invalid date", path: ["birthday"] });
      return;
    }
    if (t >= Date.now()) ctx.addIssue({ code: "custom", message: "Birthday must be in the past", path: ["birthday"] });
  });

export type FormData = z.infer<typeof formSchema>;

interface MemberFormProps {
  mode: "add" | "edit";
  member: Member | null;
  actorRole?: string;
  canEditRoles: boolean;
  onSubmit: (data: FormData) => void;
  isPending: boolean;
}

export function MemberForm({ mode, member, actorRole, canEditRoles, onSubmit, isPending }: MemberFormProps) {
  const memberWithExtras = member as Member & { image?: string | null; bio?: string | null };
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: member?.name ?? "",
      email: member?.email ?? "",
      role: member?.role ?? DEFAULT_USER_ROLE,
      phoneNo: member?.phoneNo ?? "",
      emergencyContact: member?.emergencyContact ?? "",
      emergencyContactName: member?.emergencyContactName ?? "",
      birthday: toDateInputValue(member?.birthday),
      image: memberWithExtras?.image ?? null,
      avatarAsset: (memberWithExtras as Member & { avatarAsset?: unknown })?.avatarAsset ?? null,
      bio: memberWithExtras?.bio ?? null,
    },
  });

  // Reset form when member or mode changes
  React.useEffect(() => {
    if (mode === "edit" && member) {
      const m = member as Member & { image?: string | null; bio?: string | null };
      form.reset({
        name: member.name ?? "",
        email: member.email ?? "",
        role: member.role,
        phoneNo: member.phoneNo ?? "",
        emergencyContact: member.emergencyContact ?? "",
        emergencyContactName: member.emergencyContactName ?? "",
        birthday: toDateInputValue(member.birthday),
        image: m.image ?? null,
        avatarAsset: m.avatarAsset ?? null,
        bio: m.bio ?? null,
      });
    } else if (mode === "add") {
      form.reset({
        name: "",
        email: "",
        role: DEFAULT_USER_ROLE,
        phoneNo: "",
        emergencyContact: "",
        emergencyContactName: "",
        birthday: "",
        image: null,
        avatarAsset: null,
        bio: null,
      });
    }
  }, [mode, member, form]);

  const availableRoles = getAvailableRoles(mode, actorRole, member?.role);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isPending && !isUploading) {
      form.handleSubmit(onSubmit)(e);
    }
  };

  return (
    <Form {...form}>
      <form
        id="member-form"
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
            const form = e.currentTarget as HTMLFormElement;
            const inputs = Array.from(form.querySelectorAll("input, select"));
            const currentIndex = inputs.indexOf(e.target);
            const nextInput = inputs[currentIndex + 1];
            if (nextInput instanceof HTMLElement) {
              e.preventDefault();
              nextInput.focus();
            }
          }
        }}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter member name" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter email address" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
                disabled={mode === "edit" && !canEditRoles}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {/* eslint-disable-next-line security/detect-object-injection -- role is from getAvailableRoles */}
                      {USER_ROLE_LABELS[role] || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
              {mode === "edit" && !canEditRoles && (
                <p className="text-muted-foreground text-xs">
                  Only ADMIN, SUPERADMIN, or DEVELOPER users can edit roles
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number </FormLabel>
              <FormControl>
                <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
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
                <Input placeholder="Enter emergency contact number" {...field} value={field.value || ""} />
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
                <Input placeholder="Enter emergency contact name" {...field} value={field.value || ""} />
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
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Pick birthday"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(form.watch("role") === USER_ROLES.TEACHER || member?.role === USER_ROLES.TEACHER) && (
          <>
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value ?? undefined}
                      onChange={(v) => field.onChange(v ?? null)}
                      onAssetChange={(asset) => form.setValue("avatarAsset", asset ?? null)}
                      onUploadStateChange={setIsUploading}
                      uploadTarget={CLOUDINARY_UPLOAD_TARGETS.USER_AVATAR}
                      disabled={isPending || isUploading}
                      aspectRatio="square"
                      className="max-w-[200px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell members about your background, specialties, and teaching style..."
                      className="min-h-[100px] resize-y"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">Max 2000 characters. Shown on your profile.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </form>
    </Form>
  );
}

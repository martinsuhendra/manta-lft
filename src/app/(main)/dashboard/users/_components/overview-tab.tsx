"use client";

import { useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Loader2,
  Mail,
  Phone,
  Calendar,
  Shield,
  KeyRound,
  User,
  PhoneCall,
  FileSignature,
  Copy,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import { useUpdateUserWaiverStatus } from "@/hooks/use-users-query";
import { USER_ROLES, USER_ROLE_LABELS, getRoleVariant } from "@/lib/types";

import { Member, MemberDetails } from "./schema";

interface PublicWaiverItem {
  id: string;
  name: string;
  contentHtml: string;
  version: number;
  isActive: boolean;
}

interface MemberWaiverStatusItem extends PublicWaiverItem {
  hasAccepted: boolean;
  acceptedVersion: number | null;
  acceptedAt: string | null;
}

interface OverviewTabProps {
  member: Member;
  memberDetails?: MemberDetails | (MemberDetails & { classSessions?: unknown[] }) | null;
}

const WAIVER_LINK_TEMPLATE = process.env.NEXT_PUBLIC_WAIVER_LINK_TEMPLATE ?? "https://example.com/waiver/{userId}";

function parseUrl(value?: string | null) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.toString();
  } catch {
    return null;
  }
}

function buildWaiverLink({ userId }: { userId: string }) {
  const linkWithUserId = WAIVER_LINK_TEMPLATE.replaceAll("{userId}", encodeURIComponent(userId));
  return parseUrl(linkWithUserId);
}

/* eslint-disable complexity, max-lines */
export function OverviewTab({ member, memberDetails }: OverviewTabProps) {
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);
  const [isSetPasswordDialogOpen, setIsSetPasswordDialogOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [sendingLinkType, setSendingLinkType] = useState<"waiver" | null>(null);
  const [isWaiverDialogOpen, setIsWaiverDialogOpen] = useState(false);
  const [waiverAgreements, setWaiverAgreements] = useState<Record<string, boolean>>({});
  const updateWaiverStatus = useUpdateUserWaiverStatus();
  const waiverLink = useMemo(() => buildWaiverLink({ userId: member.id }), [member.id]);
  const hasAcceptedAllWaivers = memberDetails?.hasAcceptedAllWaivers ?? Boolean(memberDetails?.waiverAcceptedAt);

  const { data: waiverData, isLoading: isWaiverLoading } = useQuery<{
    waivers: Array<PublicWaiverItem>;
    member: {
      waivers: MemberWaiverStatusItem[];
      hasAcceptedAll: boolean;
      pendingWaivers: PublicWaiverItem[];
    };
  }>({
    queryKey: ["user-waiver", member.id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${member.id}/waiver`);
      if (!response.ok) throw new Error("Failed to fetch waiver");
      return response.json();
    },
    enabled: isWaiverDialogOpen,
  });

  useEffect(() => {
    if (!waiverData) return;
    const nextAgreements: Record<string, boolean> = {};
    for (const waiver of waiverData.member.waivers) {
      nextAgreements[waiver.id] = waiver.hasAccepted;
    }
    setWaiverAgreements(nextAgreements);
  }, [waiverData]);

  const handleSendResetLink = async () => {
    if (!member.email) {
      toast.error("User has no email address");
      return;
    }
    setIsSendingResetLink(true);
    try {
      const res = await fetch(`/api/admin/users/${member.id}/send-reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send reset link");
        return;
      }
      toast.success("Password reset link sent to user's email");
    } catch {
      toast.error("Failed to send reset link");
    } finally {
      setIsSendingResetLink(false);
    }
  };

  const resetPasswordDialogState = () => {
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleSetNewPassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch(`/api/admin/users/${member.id}/set-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error ?? "Failed to update password");
        return;
      }

      toast.success("Password updated successfully");
      setIsSetPasswordDialogOpen(false);
      resetPasswordDialogState();
    } catch {
      toast.error("Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCopyLink = async ({ label, link }: { label: string; link: string | null }) => {
    if (!link) {
      toast.error(`${label} is not available`);
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const handleSendLinkByEmail = async ({ type, link }: { type: "waiver"; link: string | null }) => {
    if (!member.email) {
      toast.error("User has no email address");
      return;
    }
    if (!link) {
      toast.error("Waiver link is not available");
      return;
    }

    setSendingLinkType(type);
    try {
      const response = await fetch(`/api/admin/users/${member.id}/send-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, link }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error ?? `Failed to send ${type} link`);
        return;
      }

      toast.success(`Waiver link sent to ${member.email}`);
    } catch {
      toast.error(`Failed to send ${type} link`);
    } finally {
      setSendingLinkType(null);
    }
  };

  const isTeacher = member.role === USER_ROLES.TEACHER;
  const teacherDetails = isTeacher && memberDetails && "image" in memberDetails ? memberDetails : null;
  const image = teacherDetails?.image ?? (member as Member & { image?: string }).image;
  const bio = teacherDetails?.bio ?? (member as Member & { bio?: string }).bio;

  const handleSaveWaiverStatus = async () => {
    if (!waiverData) return;

    const updates = waiverData.member.waivers.filter((waiver) => {
      const nextAccepted = Boolean(waiverAgreements[waiver.id]);
      return nextAccepted !== waiver.hasAccepted;
    });

    try {
      for (const waiver of updates) {
        await updateWaiverStatus.mutateAsync({
          userId: member.id,
          waiverId: waiver.id,
          isAccepted: Boolean(waiverAgreements[waiver.id]),
        });
      }
      toast.success("Waiver status updated");
      setIsWaiverDialogOpen(false);
    } catch {
      // toast handled in mutation
    }
  };

  return (
    <div className="space-y-6">
      {isTeacher && (image || bio) && (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profile</h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {image && (
                <Avatar className="h-24 w-24">
                  <AvatarImage src={image} alt={member.name ?? "Profile"} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
              )}
              {bio && (
                <div className="flex-1">
                  <label className="text-muted-foreground text-sm font-medium">About</label>
                  <p className="mt-1 text-base whitespace-pre-wrap">{bio}</p>
                </div>
              )}
            </div>
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-muted-foreground text-sm font-medium">Name</label>
            <p className="text-base font-medium">{member.name ?? "No Name"}</p>
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="text-muted-foreground h-4 w-4" />
              <p className="text-base">{member.email ?? "No Email"}</p>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">Role</label>
            <div className="mt-1">
              <StatusBadge variant={getRoleVariant(member.role)}>
                <Shield className="mr-1 h-3 w-3" />
                {USER_ROLE_LABELS[member.role]}
              </StatusBadge>
            </div>
          </div>

          {member.phoneNo && (
            <div>
              <label className="text-muted-foreground text-sm font-medium">Phone Number</label>
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground h-4 w-4" />
                <p className="text-base">{member.phoneNo}</p>
              </div>
            </div>
          )}

          {member.emergencyContact && (
            <div>
              <label className="text-muted-foreground text-sm font-medium">Emergency Contact</label>
              <div className="flex items-center gap-2">
                <PhoneCall className="text-muted-foreground h-4 w-4" />
                <p className="text-base">
                  {member.emergencyContactName ? `${member.emergencyContactName} — ` : ""}
                  {member.emergencyContact}
                </p>
              </div>
            </div>
          )}

          {member.birthday && (
            <div>
              <label className="text-muted-foreground text-sm font-medium">Birthday</label>
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <p className="text-base">{format(new Date(member.birthday), "MMMM dd, yyyy")}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Account Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-muted-foreground text-sm font-medium">Member Since</label>
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <p className="text-base">{format(new Date(member.createdAt), "MMMM dd, yyyy")}</p>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">Last Updated</label>
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <p className="text-base">{format(new Date(member.updatedAt), "MMMM dd, yyyy")}</p>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground text-sm font-medium">Waiver</label>
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={
                  hasAcceptedAllWaivers
                    ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300 dark:hover:bg-green-950/60"
                    : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"
                }
                onClick={() => setIsWaiverDialogOpen(true)}
              >
                <FileSignature className="mr-2 h-4 w-4" />
                {hasAcceptedAllWaivers ? "All accepted" : "Pending acceptance"}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink({ label: "Waiver link", link: waiverLink })}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Waiver Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSendLinkByEmail({ type: "waiver", link: waiverLink })}
                disabled={!member.email || !waiverLink || sendingLinkType === "waiver"}
              >
                {sendingLinkType === "waiver" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Waiver Link
              </Button>
            </div>
            {memberDetails?.waiverAcceptedAt ? (
              <p className="text-muted-foreground mt-1 text-sm">
                All active waivers accepted on {format(new Date(memberDetails.waiverAcceptedAt), "MMMM dd, yyyy")}
              </p>
            ) : (
              <p className="text-muted-foreground mt-1 text-sm">Open to review active waivers and update status.</p>
            )}
          </div>

          {member.email && (
            <div>
              <label className="text-muted-foreground text-sm font-medium">Password</label>
              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleSendResetLink} disabled={isSendingResetLink}>
                    {isSendingResetLink ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="mr-2 h-4 w-4" />
                    )}
                    Send Reset Password Link
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsSetPasswordDialogOpen(true)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Set New Password
                  </Button>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">Send reset email or set a new password directly.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isWaiverDialogOpen} onOpenChange={setIsWaiverDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Member waiver status</DialogTitle>
            <DialogDescription>
              Review current waiver content and update this member&apos;s agreement status.
            </DialogDescription>
          </DialogHeader>

          {isWaiverLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading waiver...
            </div>
          ) : (
            <div className="max-h-[55vh] space-y-4 overflow-y-auto">
              {(waiverData?.member.waivers ?? []).map((waiver) => (
                <div key={waiver.id} className="space-y-3 rounded-md border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium">{waiver.name}</h3>
                    <span className="text-muted-foreground text-xs">v{waiver.version}</span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: waiver.contentHtml }} />
                  </div>
                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox
                      checked={Boolean(waiverAgreements[waiver.id])}
                      onCheckedChange={(value) =>
                        setWaiverAgreements((current) => ({
                          ...current,
                          [waiver.id]: Boolean(value),
                        }))
                      }
                    />
                    <span>Mark this member as agreed to the current version.</span>
                  </label>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWaiverDialogOpen(false)}
              disabled={updateWaiverStatus.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveWaiverStatus} disabled={isWaiverLoading || updateWaiverStatus.isPending}>
              {updateWaiverStatus.isPending ? "Saving..." : "Save waiver status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSetPasswordDialogOpen}
        onOpenChange={(open) => {
          setIsSetPasswordDialogOpen(open);
          if (!open) resetPasswordDialogState();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set new password</DialogTitle>
            <DialogDescription>Set a new password directly for this user account.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">New password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Confirm new password</label>
              <Input
                type="password"
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSetPasswordDialogOpen(false)} disabled={isUpdatingPassword}>
              Cancel
            </Button>
            <Button onClick={handleSetNewPassword} disabled={isUpdatingPassword}>
              {isUpdatingPassword ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

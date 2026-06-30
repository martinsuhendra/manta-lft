/* eslint-disable complexity, max-lines */
"use client";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { Trash2, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useMemberDetailsBase, useMemberDetailsSection } from "@/hooks/use-member-details";
import { useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users-query";
import { resolveMemberDetailsSection } from "@/lib/member-details-section";
import { canActorEditUserRoles } from "@/lib/rbac";
import { USER_ROLES, USER_ROLE_LABELS, getRoleVariant } from "@/lib/types";

import { DrawerFooterButtons } from "./drawer-footer-buttons";
import { DrawerHeaderContent } from "./drawer-header-content";
import { LoadingSpinner } from "./loading-spinner";
import { MemberForm, type FormData } from "./member-form";
import { OverviewTab } from "./overview-tab";
import { Member, MemberDetails } from "./schema";
import { TabTriggers } from "./tab-triggers";
import { AttendanceTab } from "./tabs/attendance-tab";
import { MembershipsTab } from "./tabs/memberships-tab";
import { TeacherSessionsTab } from "./tabs/teacher-sessions-tab";
import { TransactionsTab } from "./tabs/transactions-tab";

type DrawerMode = "view" | "edit" | "add" | null;

/** `GET /api/users/[id]` — same shape as list row plus teacher fields; `_count` may only include memberships. */
interface UserEditRecord {
  id: string;
  name: string | null;
  email: string | null;
  role: Member["role"];
  phoneNo: string | null;
  emergencyContact: string | null;
  emergencyContactName: string | null;
  birthday: string | Date | null;
  image?: string | null;
  avatarAsset?: unknown;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { memberships?: number };
}

function serializeBirthday(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

interface MemberDetailDrawerProps {
  member: Member | null;
  mode: DrawerMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModeChange: (mode: DrawerMode) => void;
}

function isPrivilegedRole(role?: string) {
  return role === USER_ROLES.SUPERADMIN || role === USER_ROLES.DEVELOPER;
}

const useDeletePermissions = (member: Member | null, session: ReturnType<typeof useSession>["data"]) => {
  const currentUserRole = session?.user.role;
  const canDeleteSuperAdmin = isPrivilegedRole(currentUserRole);
  const isTargetSuperAdmin = isPrivilegedRole(member?.role);
  const isSelfDelete = member?.id === session?.user.id;
  const canDelete = !isSelfDelete && (!isTargetSuperAdmin || canDeleteSuperAdmin);

  return { canDelete, isSelfDelete, isTargetSuperAdmin, canDeleteSuperAdmin };
};

interface WarningMessagesProps {
  canDelete: boolean;
  isSelfDelete: boolean;
  isTargetSuperAdmin: boolean;
  canDeleteSuperAdmin: boolean;
  member: Member | null;
}

const WarningMessages = ({
  canDelete,
  isSelfDelete,
  isTargetSuperAdmin,
  canDeleteSuperAdmin,
  member,
}: WarningMessagesProps) => {
  if (!canDelete) {
    return (
      <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-destructive mt-0.5 h-5 w-5" />
          <div className="space-y-1">
            <p className="text-destructive text-sm font-medium">Cannot Delete Member</p>
            <p className="text-muted-foreground text-sm">
              {isSelfDelete && "You cannot delete your own account."}
              {isTargetSuperAdmin &&
                !canDeleteSuperAdmin &&
                "Only SUPERADMIN or DEVELOPER users can delete SUPERADMIN/DEVELOPER accounts."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-600" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-orange-800">Warning</p>
          <p className="text-sm text-orange-700">
            {member?.role === USER_ROLES.TEACHER
              ? "This teacher's profile and session assignments will also be deleted. This action cannot be undone."
              : "This member's memberships, transactions, and attendance records will also be deleted. This action cannot be undone."}
          </p>
        </div>
      </div>
    </div>
  );
};

export function MemberDetailDrawer({ member, mode, open, onOpenChange, onModeChange }: MemberDetailDrawerProps) {
  const { data: session } = useSession();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("overview");

  const currentUserRole = session?.user.role;
  const canEditRoles = canActorEditUserRoles(currentUserRole);
  const { canDelete, isSelfDelete, isTargetSuperAdmin, canDeleteSuperAdmin } = useDeletePermissions(member, session);

  const isViewMode = mode === "view" && !!member?.id && open;

  const activeSection = resolveMemberDetailsSection(activeTab);

  const { data: memberBase, isLoading: isLoadingBase } = useMemberDetailsBase(member?.id, isViewMode);

  const { data: sectionDetails, isLoading: isLoadingSection } = useMemberDetailsSection(
    member?.id,
    activeSection ?? "memberships",
    isViewMode && activeSection !== null,
  );

  const memberDetails = React.useMemo((): MemberDetails | undefined => {
    if (!memberBase) return undefined;

    return {
      ...memberBase,
      memberships: sectionDetails?.memberships ?? memberBase.memberships ?? [],
      transactions: sectionDetails?.transactions ?? memberBase.transactions ?? [],
      bookings: sectionDetails?.bookings ?? memberBase.bookings ?? [],
      classSessions: sectionDetails?.classSessions ?? memberBase.classSessions ?? [],
      scheduledSessionCount: memberBase.scheduledSessionCount,
    };
  }, [memberBase, sectionDetails]);

  const isLoadingDetails = isLoadingBase || (activeSection !== null && activeTab !== "overview" && isLoadingSection);

  // Hydrate edit form from canonical user row (birthday, teacher profile, etc.)
  const { data: userForEdit, isLoading: isLoadingUserForEdit } = useQuery<UserEditRecord>({
    queryKey: ["user-edit", member?.id],
    queryFn: async () => {
      if (!member?.id) throw new Error("Member ID is required");
      const response = await fetch(`/api/users/${member.id}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
    enabled: open && !!member?.id,
    staleTime: 1000 * 60,
  });

  const memberForForm = React.useMemo((): Member | null => {
    if (!member) return null;
    if (!userForEdit) return member;

    const birthdayFromApi = userForEdit.birthday;
    const birthdayResolved = birthdayFromApi == null ? null : serializeBirthday(birthdayFromApi);

    return {
      ...member,
      name: userForEdit.name ?? member.name,
      email: userForEdit.email ?? member.email,
      role: userForEdit.role,
      phoneNo: userForEdit.phoneNo ?? member.phoneNo,
      emergencyContact: userForEdit.emergencyContact ?? member.emergencyContact,
      emergencyContactName: userForEdit.emergencyContactName ?? member.emergencyContactName,
      birthday: birthdayResolved,
      image: userForEdit.image ?? member.image,
      avatarAsset: userForEdit.avatarAsset ?? member.avatarAsset,
      bio: userForEdit.bio ?? member.bio,
      updatedAt: userForEdit.updatedAt,
      _count: member._count,
    };
  }, [member, userForEdit]);

  // Reset tab when drawer opens/closes
  React.useEffect(() => {
    if (open && mode === "view") {
      setActiveTab("overview");
    }
  }, [open, mode]);

  const handleSubmit = (data: FormData) => {
    if (mode === "add") {
      createUser.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          onModeChange(null);
          toast.success("Member created successfully");
        },
      });
      return;
    }

    if (mode === "edit" && member) {
      updateUser.mutate(
        { userId: member.id, data },
        {
          onSuccess: () => {
            onOpenChange(false);
            onModeChange(null);
            toast.success("Member updated successfully");
          },
        },
      );
    }
  };

  const handleDelete = () => {
    if (!member || !canDelete) return;

    deleteUser.mutate(member.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        onOpenChange(false);
        onModeChange(null);
        toast.success("Member deleted successfully");
      },
    });
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} direction="right" handleOnly>
        <DrawerContent className="!w-auto !min-w-fit !select-text sm:!max-w-none [&_*]:!select-text">
          <DrawerHeader>{mode && <DrawerHeaderContent mode={mode} canEditRoles={canEditRoles} />}</DrawerHeader>

          <div className="overflow-y-auto px-4 pb-4">
            {mode === "view" && member ? (
              isLoadingDetails ? (
                <LoadingSpinner />
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-col justify-start gap-6">
                  <TabTriggers
                    memberDetails={memberDetails}
                    memberRole={member.role}
                    scheduledSessionCount={memberBase?.scheduledSessionCount}
                  />

                  <TabsContent value="overview" className="relative flex flex-col gap-4 overflow-auto">
                    <OverviewTab member={member} memberDetails={memberDetails} />
                  </TabsContent>

                  {member.role === USER_ROLES.TEACHER ? (
                    <TabsContent value="sessions" className="flex flex-col">
                      {activeTab === "sessions" && isLoadingSection ? (
                        <LoadingSpinner />
                      ) : memberDetails ? (
                        <TeacherSessionsTab sessions={memberDetails.classSessions ?? []} />
                      ) : (
                        <LoadingSpinner />
                      )}
                    </TabsContent>
                  ) : (
                    <>
                      <TabsContent value="memberships" className="flex flex-col">
                        {activeTab === "memberships" && isLoadingSection ? (
                          <LoadingSpinner />
                        ) : memberDetails ? (
                          <MembershipsTab
                            memberships={memberDetails.memberships}
                            memberId={member.id}
                            memberName={member.name}
                          />
                        ) : (
                          <LoadingSpinner />
                        )}
                      </TabsContent>

                      <TabsContent value="transactions" className="flex flex-col">
                        {activeTab === "transactions" && isLoadingSection ? (
                          <LoadingSpinner />
                        ) : memberDetails ? (
                          <TransactionsTab transactions={memberDetails.transactions} memberId={member.id} />
                        ) : (
                          <LoadingSpinner />
                        )}
                      </TabsContent>

                      <TabsContent value="attendance" className="flex flex-col">
                        {activeTab === "attendance" && isLoadingSection ? (
                          <LoadingSpinner />
                        ) : memberDetails ? (
                          <AttendanceTab bookings={memberDetails.bookings} memberId={member.id} />
                        ) : (
                          <LoadingSpinner />
                        )}
                      </TabsContent>
                    </>
                  )}
                </Tabs>
              )
            ) : mode === "edit" || mode === "add" ? (
              mode === "edit" && isLoadingUserForEdit ? (
                <LoadingSpinner />
              ) : (
                <MemberForm
                  key={mode === "edit" ? `edit-${member?.id}` : "add"}
                  mode={mode}
                  member={mode === "edit" ? memberForForm : member}
                  actorRole={currentUserRole}
                  canEditRoles={canEditRoles}
                  onSubmit={handleSubmit}
                  isPending={createUser.isPending || updateUser.isPending}
                />
              )
            ) : null}
          </div>

          {mode && (
            <DrawerFooterButtons
              mode={mode}
              canDelete={canDelete}
              isPending={createUser.isPending || updateUser.isPending}
              onEdit={() => {
                queueMicrotask(() => onModeChange("edit"));
              }}
              onDelete={() => setDeleteDialogOpen(true)}
            />
          )}
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the member account and remove all associated
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {member && (
            <div className="space-y-4">
              {/* Member Info */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{member.name ?? "No Name"}</span>
                  <StatusBadge variant={getRoleVariant(member.role)}>{USER_ROLE_LABELS[member.role]}</StatusBadge>
                </div>
                <div className="text-muted-foreground text-sm">{member.email ?? "No Email"}</div>
                <div className="text-muted-foreground text-sm">
                  {member.role === USER_ROLES.TEACHER
                    ? `${member._count.bookings} session(s) taught`
                    : `${member._count.memberships} membership(s), ${member._count.transactions} transaction(s), ${member._count.bookings} booking(s)`}
                </div>
              </div>

              <WarningMessages
                canDelete={canDelete}
                isSelfDelete={isSelfDelete}
                isTargetSuperAdmin={isTargetSuperAdmin}
                canDeleteSuperAdmin={canDeleteSuperAdmin}
                member={member}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!canDelete || deleteUser.isPending}
              className="bg-destructive hover:bg-destructive/90 text-white hover:text-white"
            >
              {deleteUser.isPending ? "Deleting..." : "Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

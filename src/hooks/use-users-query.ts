"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { unwrapUsersListResponse, type UsersListResponse } from "@/lib/users-api";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "SUPERADMIN" | "DEVELOPER" | "MEMBER" | "TEACHER";
  phoneNo: string | null;
  emergencyContact: string | null;
  emergencyContactName?: string | null;
  waiverAcceptedAt?: string | null;
  hasAcceptedAllWaivers?: boolean;
  birthday?: string | null;
  image?: string | null;
  avatarAsset?: unknown;
  createdAt: string;
  updatedAt: string;
  _count: {
    memberships: number;
    transactions: number;
    bookings: number;
  };
}

// Re-export from mutations for backward compatibility
export { useCreateUser, useUpdateUser, useDeleteUser, useUpdateUserWaiverStatus } from "./use-users-mutation";

export function useTeachers(enabled = true) {
  return useQuery<User[]>({
    queryKey: ["users", "teachers", enabled],
    queryFn: async () => {
      try {
        const response = await axios.get<UsersListResponse<User>>("/api/users", {
          params: { role: "TEACHER", limit: 500 },
        });
        return unwrapUsersListResponse(response.data);
      } catch (error) {
        console.error("Teachers API error:", error);
        throw error;
      }
    },
    enabled,
    retry: false,
  });
}

export function useUsers(params?: { role?: string; page?: number; limit?: number; search?: string }) {
  return useQuery<User[]>({
    queryKey: ["users", params],
    queryFn: async () => {
      try {
        const response = await axios.get<UsersListResponse<User>>("/api/users", {
          params: { limit: 200, ...params },
        });
        return unwrapUsersListResponse(response.data);
      } catch (error) {
        console.error("Users API error:", error);
        throw error;
      }
    },
    retry: false,
  });
}

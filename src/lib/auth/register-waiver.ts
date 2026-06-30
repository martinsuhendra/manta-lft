import type { WaiverSettingsRecord } from "@/lib/waiver-settings";

interface RegisterWaiverInput {
  acceptWaiver?: boolean;
  waiverVersion?: number;
}

export type RegisterWaiverError = { error: string; status: number };

export function validateRegistrationWaiver(
  waiver: WaiverSettingsRecord,
  input: RegisterWaiverInput,
): RegisterWaiverError | null {
  if (!waiver.isActive) return null;

  if (!input.acceptWaiver) {
    return { error: "You must agree to the waiver", status: 400 };
  }

  if (input.waiverVersion !== waiver.version) {
    return { error: "Waiver has changed. Please refresh and try again.", status: 409 };
  }

  return null;
}

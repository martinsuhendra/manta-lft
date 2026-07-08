import type { WaiverRecord } from "@/lib/waiver-settings";

interface RegisterWaiverInput {
  acceptWaiver?: boolean;
  waiverAcceptances?: Array<{ waiverId: string; version: number }>;
}

export type RegisterWaiverError = { error: string; status: number };

export function validateRegistrationWaiver(
  activeWaivers: WaiverRecord[],
  input: RegisterWaiverInput,
): RegisterWaiverError | null {
  if (activeWaivers.length === 0) return null;

  if (!input.acceptWaiver) {
    return { error: "You must agree to the waiver", status: 400 };
  }

  const provided = new Map((input.waiverAcceptances ?? []).map((entry) => [entry.waiverId, entry.version]));

  for (const waiver of activeWaivers) {
    if (provided.get(waiver.id) !== waiver.version) {
      return { error: "Waiver has changed. Please refresh and try again.", status: 409 };
    }
  }

  return null;
}

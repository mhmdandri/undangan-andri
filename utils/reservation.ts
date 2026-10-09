import { getServerApiUrl, getPublicApiUrl } from "@/utils/api";

export type Reservation = {
  id?: number;
  name: string;
  code: string;
  email?: string;
  total_guests?: number;
  is_present?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export async function getReservationByCode(
  rawCode: string
): Promise<Reservation | null> {
  const code = (rawCode || "").trim();
  if (!code) return null;

  const backendUrl = getServerApiUrl();
  const publicApiUrl = getPublicApiUrl();

  // 1. Try direct check-in endpoint (supported by Go backend / localhost)
  try {
    const res = await fetch(
      `${backendUrl}/api/reservations/check-in/${encodeURIComponent(code)}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      }
    );
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.name) {
        return json.data as Reservation;
      }
    }
  } catch {
    // Continue to fallback
  }

  // 2. Fallback to reservations list from backend URL and public API
  const apiUrls = Array.from(
    new Set([
      `${backendUrl}/api/reservations`,
      `${publicApiUrl}/api/reservations`,
    ])
  );

  for (const url of apiUrls) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        const list: Reservation[] = Array.isArray(json?.data) ? json.data : [];
        const found = list.find(
          (item) => String(item.code).trim() === code
        );
        if (found && found.name) {
          return found;
        }
      }
    } catch {
      // Continue to next URL
    }
  }

  return null;
}

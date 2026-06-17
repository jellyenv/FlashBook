import {
  clerkSync,
  getLayout,
  getMyProfile,
  getPublicSlots,
  getTheme,
  listAppointments,
  listCampaigns,
  listContacts,
  listExceptions,
  listFlash,
  listPortfolio,
  listProducts,
  listRules,
} from "@/app/clientService";
import { authHeaders } from "@/lib/session";

export async function syncClerkProfile(
  email: string,
  full_name: string | null,
) {
  try {
    await clerkSync({
      body: { email, full_name },
      headers: await authHeaders(),
    });
  } catch {
    /* non-fatal: profile is still auto-provisioned by the auth dependency */
  }
}

export async function fetchMyProfile() {
  const { data } = await getMyProfile({ headers: await authHeaders() });
  return data ?? null;
}

export async function fetchTheme() {
  const { data } = await getTheme({ headers: await authHeaders() });
  return data ?? null;
}

export async function fetchAppointments(startISO: string, endISO: string) {
  const { data } = await listAppointments({
    query: { start: startISO, end: endISO },
    headers: await authHeaders(),
  });
  return data ?? [];
}

export async function fetchRules() {
  const { data } = await listRules({ headers: await authHeaders() });
  return data ?? [];
}

export async function fetchExceptions() {
  const { data } = await listExceptions({ headers: await authHeaders() });
  return data ?? [];
}

export async function fetchContacts() {
  const { data } = await listContacts({ headers: await authHeaders() });
  return data ?? [];
}

export async function fetchPortfolio() {
  const { data } = await listPortfolio({ headers: await authHeaders() });
  return data ?? [];
}

export async function fetchFlash() {
  const { data } = await listFlash({ headers: await authHeaders() });
  return data ?? [];
}

export async function fetchProducts() {
  const { data } = await listProducts({ headers: await authHeaders() });
  return data ?? [];
}

export async function fetchBookingLayout() {
  const { data } = await getLayout({ headers: await authHeaders() });
  return data ?? null;
}

export async function fetchCampaigns() {
  const { data } = await listCampaigns({ headers: await authHeaders() });
  return data ?? [];
}

/** Next `days` days of availability for an artist slug (for the simulated test). */
export async function fetchAvailabilityPreview(slug: string, days = 14) {
  const today = new Date();
  const results = await Promise.all(
    Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const date = d.toISOString().slice(0, 10);
      return getPublicSlots({ path: { slug }, query: { date } }).then((r) => ({
        date,
        slots: r.data ?? [],
      }));
    }),
  );
  return results;
}

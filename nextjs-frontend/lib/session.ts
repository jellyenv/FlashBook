import { auth, currentUser } from "@clerk/nextjs/server";

/** Clerk session token for the current request (sent as Bearer to the backend). */
export async function getToken(): Promise<string | undefined> {
  const { getToken } = await auth();
  return (await getToken()) ?? undefined;
}

export async function authHeaders(): Promise<{ Authorization: string }> {
  const token = await getToken();
  return { Authorization: `Bearer ${token ?? ""}` };
}

/** The signed-in Clerk user, mapped to the shape the studio UI expects. */
export async function getCurrentUser() {
  const u = await currentUser();
  if (!u) return null;
  const email =
    u.primaryEmailAddress?.emailAddress ??
    u.emailAddresses[0]?.emailAddress ??
    "";
  const full_name =
    u.fullName ?? [u.firstName, u.lastName].filter(Boolean).join(" ") ?? null;
  return { email, full_name: full_name || null };
}

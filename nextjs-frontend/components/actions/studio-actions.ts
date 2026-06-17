"use server";

import { revalidatePath } from "next/cache";

import {
  createAppointment,
  createCampaign,
  createContact,
  createException,
  createFlash,
  createPortfolioImage,
  createProduct,
  createRule,
  deleteAppointment,
  deleteCampaign,
  deleteContact,
  deleteException,
  deleteFlash,
  deletePortfolioImage,
  deleteProduct,
  deleteRule,
  getPublicSlots,
  updateAppointment,
  updateFlash,
  updateLayout,
  updateMyProfile,
  updateProduct,
  updateTheme,
} from "@/app/clientService";
import { authHeaders } from "@/lib/session";

function extract(error: unknown): string {
  const detail = (error as { detail?: unknown })?.detail;
  if (typeof detail === "string") return detail;
  return "Something went wrong. Please try again.";
}

// --- Availability ---

export async function createRuleAction(input: {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
}) {
  const { error } = await createRule({
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/hours");
  return { ok: true };
}

export async function deleteRuleAction(ruleId: string) {
  await deleteRule({ path: { rule_id: ruleId }, headers: await authHeaders() });
  revalidatePath("/studio/hours");
}

export async function createExceptionAction(input: {
  date: string;
  type: "custom_hours" | "closed";
  start_time?: string | null;
  end_time?: string | null;
  note?: string | null;
}) {
  const { error } = await createException({
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/hours");
  return { ok: true };
}

export async function deleteExceptionAction(exceptionId: string) {
  await deleteException({
    path: { exception_id: exceptionId },
    headers: await authHeaders(),
  });
  revalidatePath("/studio/hours");
}

// --- Appointments ---

export type NewAppointment = {
  start_at: string;
  end_at: string;
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;
  client_instagram?: string | null;
  size?: string | null;
  placement?: string | null;
  color_type?: "color" | "black_and_grey" | null;
  subject?: string | null;
  accommodations_notes?: string | null;
  has_guests?: boolean;
  guests_notes?: string | null;
  deposit_cents?: number;
};

export async function createAppointmentAction(input: NewAppointment) {
  const { error } = await createAppointment({
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/calendar");
  revalidatePath("/studio");
  return { ok: true };
}

export async function setAppointmentStatusAction(
  appointmentId: string,
  status: "confirmed" | "declined" | "cancelled" | "completed" | "no_show",
) {
  const { error } = await updateAppointment({
    path: { appointment_id: appointmentId },
    body: { status },
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/calendar");
  revalidatePath("/studio");
  return { ok: true };
}

export async function deleteAppointmentAction(appointmentId: string) {
  await deleteAppointment({
    path: { appointment_id: appointmentId },
    headers: await authHeaders(),
  });
  revalidatePath("/studio/calendar");
}

// --- Contacts ---

export async function createContactAction(input: {
  name: string;
  phone?: string | null;
  email?: string | null;
  instagram?: string | null;
  notes?: string | null;
}) {
  const { error } = await createContact({
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/contacts");
  return { ok: true };
}

export async function deleteContactAction(contactId: string) {
  await deleteContact({
    path: { contact_id: contactId },
    headers: await authHeaders(),
  });
  revalidatePath("/studio/contacts");
}

// --- Profile & theme ---

export async function updateProfileAction(input: Record<string, unknown>) {
  const { error } = await updateMyProfile({
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/profile");
  return { ok: true };
}

export async function updateThemeAction(input: Record<string, unknown>) {
  const { error } = await updateTheme({
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/profile");
  return { ok: true };
}

// --- Portfolio ---

export async function createPortfolioImageAction(input: {
  image_url: string;
  caption?: string | null;
  is_healed?: boolean;
  tattoo_date?: string | null;
}) {
  const { error } = await createPortfolioImage({
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/portfolio");
  return { ok: true };
}

export async function deletePortfolioImageAction(imageId: string) {
  await deletePortfolioImage({
    path: { image_id: imageId },
    headers: await authHeaders(),
  });
  revalidatePath("/studio/portfolio");
}

// --- Flash ---

export type FlashInput = {
  image_url: string;
  title?: string | null;
  description?: string | null;
  price_min_cents?: number | null;
  price_max_cents?: number | null;
  price_plus?: boolean;
  size_min?: string | null;
  size_plus?: boolean;
  ask_about?: boolean;
  event_tag?: string | null;
};

export async function createFlashAction(input: FlashInput) {
  const { error } = await createFlash({
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/flash");
  return { ok: true };
}

export async function updateFlashAction(
  pieceId: string,
  input: Partial<FlashInput> & { status?: "available" | "claimed" },
) {
  const { error } = await updateFlash({
    path: { piece_id: pieceId },
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/flash");
  return { ok: true };
}

export async function deleteFlashAction(pieceId: string) {
  await deleteFlash({
    path: { piece_id: pieceId },
    headers: await authHeaders(),
  });
  revalidatePath("/studio/flash");
}

// --- Merch products ---

export type ProductInput = {
  title: string;
  description?: string | null;
  price_cents: number;
  image_url?: string | null;
  inventory?: number | null;
  active?: boolean;
};

export async function createProductAction(input: ProductInput) {
  const { error } = await createProduct({
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/merch");
  return { ok: true };
}

export async function updateProductAction(
  productId: string,
  input: Partial<ProductInput>,
) {
  const { error } = await updateProduct({
    path: { product_id: productId },
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/merch");
  return { ok: true };
}

export async function deleteProductAction(productId: string) {
  await deleteProduct({
    path: { product_id: productId },
    headers: await authHeaders(),
  });
  revalidatePath("/studio/merch");
}

// --- Campaigns (drafts) ---

export async function createCampaignAction(input: {
  name: string;
  body: string;
  link?: string | null;
  channel: "email" | "sms";
}) {
  const { error } = await createCampaign({
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/campaigns");
  return { ok: true };
}

export async function deleteCampaignAction(campaignId: string) {
  await deleteCampaign({
    path: { campaign_id: campaignId },
    headers: await authHeaders(),
  });
  revalidatePath("/studio/campaigns");
}

// --- Booking page layout ---

export async function updateBookingPageAction(input: {
  draft?: { key: string; enabled: boolean }[];
  announcement_banner?: string | null;
  announcement_active?: boolean;
  publish?: boolean;
}) {
  const { error } = await updateLayout({
    body: input,
    headers: await authHeaders(),
  });
  if (error) return { error: extract(error) };
  revalidatePath("/studio/booking-page");
  return { ok: true };
}

// --- Public slots (used by the booking flow client) ---

export async function fetchPublicSlotsAction(slug: string, date: string) {
  const { data, error } = await getPublicSlots({
    path: { slug },
    query: { date },
  });
  if (error) return { slots: [] };
  return { slots: data ?? [] };
}

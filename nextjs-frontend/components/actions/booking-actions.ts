"use server";

import { book, checkout } from "@/app/clientService";

export type BookingInput = {
  start_at: string;
  end_at: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  size?: string | null;
  placement?: string | null;
  color_type?: "color" | "black_and_grey" | null;
  subject?: string | null;
  accommodations_notes?: string | null;
  has_guests: boolean;
  guests_notes?: string | null;
  age_confirmed: boolean;
  payment_method_id?: string | null;
};

export async function submitBookingAction(slug: string, input: BookingInput) {
  try {
    const { data, error } = await book({ path: { slug }, body: input });
    if (error || !data) {
      const detail = (error as { detail?: unknown })?.detail;
      return { error: typeof detail === "string" ? detail : "Booking failed." };
    }
    return { status: data.status, message: data.message };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export type CheckoutInput = {
  items: { product_id: string; quantity: number }[];
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  shipping_address?: string | null;
  notes?: string | null;
  accepted_terms: boolean;
};

export async function submitCheckoutAction(slug: string, input: CheckoutInput) {
  try {
    const { data, error } = await checkout({ path: { slug }, body: input });
    if (error || !data) {
      const detail = (error as { detail?: unknown })?.detail;
      return {
        error: typeof detail === "string" ? detail : "Checkout failed.",
      };
    }
    return {
      order_id: data.order_id,
      total_cents: data.total_cents,
      message: data.message,
    };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

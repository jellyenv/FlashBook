"use server";

import { reportIssue } from "@/app/clientService";

export async function submitIssueReport(input: {
  message: string;
  role?: string;
  email?: string | null;
  page?: string | null;
}) {
  try {
    const { data, error } = await reportIssue({ body: input });
    if (error || !data) {
      return { error: "Couldn't submit your report. Please try again." };
    }
    return { incident_code: data.incident_code, message: data.message };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

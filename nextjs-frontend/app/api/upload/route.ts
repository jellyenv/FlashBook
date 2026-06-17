import { auth } from "@clerk/nextjs/server";

/** Proxy image uploads to the FastAPI backend with the caller's Clerk token,
 * so the browser never needs the backend URL or a public API key. */
export async function POST(req: Request) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inForm = await req.formData();
  const file = inForm.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const out = new FormData();
  out.append("file", file, file.name);

  const res = await fetch(`${process.env.API_BASE_URL}/uploads/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: out,
  });

  const data = await res.json().catch(() => ({}));
  return Response.json(data, { status: res.status });
}

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8888";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.code) {
      return NextResponse.json(
        { error: "Kode reservasi wajib diisi", status: "error" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/reservations/check-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: String(body.code).trim(),
        actual_guest:
          typeof body.actual_guest === "number"
            ? body.actual_guest
            : Number(body.actual_guest) || 1,
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying POST check-in:", error);
    return NextResponse.json(
      {
        error: "Gagal menghubungi server check-in backend. Pastikan server aktif.",
        status: "error",
      },
      { status: 502 }
    );
  }
}

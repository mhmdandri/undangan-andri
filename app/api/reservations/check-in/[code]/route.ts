import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8888";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    if (!code) {
      return NextResponse.json(
        { error: "Kode reservasi diperlukan", status: "error" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/reservations/check-in/${encodeURIComponent(code)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying GET check-in:", error);
    return NextResponse.json(
      {
        error: "Gagal menghubungi server check-in backend. Pastikan server aktif.",
        status: "error",
      },
      { status: 502 }
    );
  }
}

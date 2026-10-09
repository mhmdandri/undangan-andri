import { NextRequest, NextResponse } from "next/server";
import { getServerApiUrl } from "@/utils/api";

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

    const backendUrl = getServerApiUrl();
    const response = await fetch(
      `${backendUrl}/api/reservations/check-in/${encodeURIComponent(code)}`,
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

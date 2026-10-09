import { NextRequest, NextResponse } from "next/server";
import { getServerApiUrl, getPublicApiUrl } from "@/utils/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.guests) || body.guests.length === 0) {
      return NextResponse.json(
        { error: "Daftar tamu (array 'guests') tidak boleh kosong", status: "error" },
        { status: 400 }
      );
    }

    const targetUrls = Array.from(
      new Set([
        `${getServerApiUrl()}/api/reservations/batch`,
        `${getPublicApiUrl()}/api/reservations/batch`,
        "http://localhost:8888/api/reservations/batch",
      ])
    );

    let lastError: unknown = null;

    for (const url of targetUrls) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });

        const contentType = response.headers.get("content-type") || "";
        const rawText = await response.text();

        let data: unknown = null;
        if (contentType.includes("application/json") || rawText.trim().startsWith("{") || rawText.trim().startsWith("[")) {
          try {
            data = JSON.parse(rawText);
          } catch {
            data = null;
          }
        }

        if (response.ok && data) {
          return NextResponse.json(data, { status: response.status });
        }

        if (data && typeof data === "object") {
          return NextResponse.json(data, { status: response.status });
        }

        // If 404 plain text, try next target URL
        if (response.status === 404) {
          continue;
        }

        return NextResponse.json(
          { error: rawText || "Server error", status: "error" },
          { status: response.status }
        );
      } catch (err) {
        lastError = err;
      }
    }

    return NextResponse.json(
      {
        error:
          "Gagal menghubungi endpoint batch backend. Pastikan server Go port 8888 aktif dan route /api/reservations/batch sudah terpasang.",
        detail: lastError instanceof Error ? lastError.message : String(lastError),
        status: "error",
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("Error in Next.js /api/reservations/batch proxy:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan internal proxy API",
        status: "error",
      },
      { status: 500 }
    );
  }
}

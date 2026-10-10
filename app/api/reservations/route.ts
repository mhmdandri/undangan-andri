import { NextRequest, NextResponse } from "next/server";
import { getServerApiUrl, getPublicApiUrl } from "@/utils/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (
    searchParams.get("q") ||
    searchParams.get("search") ||
    ""
  ).trim().toLowerCase();

  const targetUrls = Array.from(
    new Set([
      `${getServerApiUrl()}/api/reservations`,
      `${getPublicApiUrl()}/api/reservations`,
      "http://localhost:8888/api/reservations",
    ]),
  );

  for (const url of targetUrls) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });

      const rawText = await response.text();
      let data: { data?: Array<{ name?: string; code?: string }> } | null = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }

      if (response.ok && data) {
        // Jika terdapat parameter query pencarian, filter data di sisi server
        if (query && Array.isArray(data.data)) {
          const filtered = data.data.filter((item) => {
            const matchesName = (item.name || "").toLowerCase().includes(query);
            const matchesCode = (item.code || "").toLowerCase().includes(query);
            return matchesName || matchesCode;
          });

          return NextResponse.json(
            {
              data: filtered,
              message: "Search reservations successfully!",
              total: filtered.length,
            },
            { status: response.status },
          );
        }

        return NextResponse.json(data, { status: response.status });
      }
    } catch {
      // Continue to next URL
    }
  }

  return NextResponse.json(
    {
      data: [],
      message: "Gagal mengambil daftar reservasi dari backend",
      error: "Not found",
    },
    { status: 502 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const targetUrls = Array.from(
      new Set([
        `${getServerApiUrl()}/api/reservations`,
        `${getPublicApiUrl()}/api/reservations`,
        "http://localhost:8888/api/reservations",
      ]),
    );

    for (const url of targetUrls) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });

        const rawText = await response.text();
        let data: unknown = null;
        try {
          data = JSON.parse(rawText);
        } catch {
          data = null;
        }

        if (response.ok && data) {
          return NextResponse.json(data, { status: response.status });
        }

        if (data) {
          return NextResponse.json(data, { status: response.status });
        }
      } catch {
        // Continue to next URL
      }
    }

    return NextResponse.json(
      { error: "Gagal menghubungkan ke server reservasi", status: "error" },
      { status: 502 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal server error", status: "error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerApiUrl, getPublicApiUrl } from "@/utils/api";

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

    const targetUrls = Array.from(
      new Set(
        [
          getServerApiUrl()
            ? `${getServerApiUrl()}/api/reservations/${encodeURIComponent(code)}`
            : null,
          getPublicApiUrl()
            ? `${getPublicApiUrl()}/api/reservations/${encodeURIComponent(code)}`
            : null,
        ].filter(Boolean) as string[]
      )
    );

    for (const url of targetUrls) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
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

        if (response.ok) {
          return NextResponse.json(data ?? { message: rawText }, {
            status: response.status,
          });
        }
      } catch {
        // Continue fallback
      }
    }

    return NextResponse.json(
      {
        error: "Gagal mengambil data reservasi dari backend",
        status: "error",
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("Error proxying GET reservation by code:", error);
    return NextResponse.json(
      { error: "Internal server error", status: "error" },
      { status: 500 }
    );
  }
}

async function handleUpdateReservation(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
  preferredMethod: "PUT" | "PATCH" = "PUT"
) {
  try {
    const { code } = await context.params;
    if (!code) {
      return NextResponse.json(
        { error: "Kode reservasi diperlukan", status: "error" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);

    const targetUrls = Array.from(
      new Set(
        [
          getServerApiUrl()
            ? `${getServerApiUrl()}/api/reservations/${encodeURIComponent(code)}`
            : null,
          getPublicApiUrl()
            ? `${getPublicApiUrl()}/api/reservations/${encodeURIComponent(code)}`
            : null,
        ].filter(Boolean) as string[]
      )
    );

    const methodsToTry =
      preferredMethod === "PUT" ? ["PUT", "PATCH"] : ["PATCH", "PUT"];

    for (const url of targetUrls) {
      for (const method of methodsToTry) {
        try {
          const response = await fetch(url, {
            method,
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

          if (response.ok) {
            return NextResponse.json(data ?? { message: rawText }, {
              status: response.status,
            });
          }

          if (response.status !== 404 && response.status !== 405) {
            return NextResponse.json(
              data ?? { error: rawText || "Gagal memperbarui reservasi" },
              { status: response.status }
            );
          }
        } catch {
          // Try next
        }
      }
    }

    return NextResponse.json(
      {
        error: "Gagal memperbarui reservasi di backend",
        status: "error",
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("Error updating reservation:", error);
    return NextResponse.json(
      { error: "Internal server error", status: "error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  return handleUpdateReservation(request, context, "PUT");
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  return handleUpdateReservation(request, context, "PATCH");
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  return handleUpdateReservation(request, context, "PUT");
}


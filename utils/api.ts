/**
 * API configuration helper.
 * Manages dynamic API endpoints based on environment variables.
 *
 * - Client-side (Browser): NEXT_PUBLIC_API_URL
 * - Server-side (Node / SSR / API routes): INTERNAL_API_URL || NEXT_PUBLIC_API_URL
 */

export const getPublicApiUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_API_URL || "https://api.mohaproject.tech"
  ).replace(/\/+$/, "");
};

export const getServerApiUrl = (): string => {
  return (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8888"
  ).replace(/\/+$/, "");
};

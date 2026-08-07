import { ROUTES } from "@/constants/routes";

/**
 * Builds the car listing URL with preserved filter query parameters.
 *
 * Use this for navigation links that should keep current search, make, body type, or other listing filters active.
 *
 * @param params - Query parameters to include in the listing URL.
 * @returns Car listing URL with the supplied query string.
 */
export function createCarSearchUrl(params: {
  search?: string;
  make?: string;
  bodyType?: string;
  [key: string]: string | undefined;
}): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `${ROUTES.HOME.CARS}?${query}` : ROUTES.HOME.CARS;
}

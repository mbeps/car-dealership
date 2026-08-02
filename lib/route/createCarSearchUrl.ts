import { ROUTES } from "@/constants/routes";

/**
 * Builds car listing URL with query params.
 *
 * @param params - Filter params (make, bodyType, etc.)
 * @returns Cars URL with query string
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

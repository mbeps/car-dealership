import { useState, useCallback } from "react";
import { toast } from "sonner";

type UseFetchResult<T, Args extends unknown[]> = {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  fn: (...args: Args) => Promise<T | undefined>;
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
};

/**
 * Generic hook for async server actions.
 * Manages loading/error states and shows toast on errors.
 * Exposes manual trigger function and data setter.
 *
 * @param cb - Async function to execute (typically server action)
 * @returns Object with data, loading, error, fn trigger, and setData
 * @example
 * const { fn: deleteFn, loading } = useFetch(deleteCar);
 * await deleteFn(carId);
 */
const useFetch = <T, Args extends unknown[] = []>(
  cb: (...args: Args) => Promise<T>
): UseFetchResult<T, Args> => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fn = useCallback(
    async (...args: Args) => {
      setLoading(true);
      setError(null);

      try {
        const response = await cb(...args);
        setData(response);
        setError(null);
        return response;
      } catch (error) {
        const err = error as Error;
        setError(err);
        toast.error(err.message);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [cb]
  );

  return { data, loading, error, fn, setData };
};

export default useFetch;

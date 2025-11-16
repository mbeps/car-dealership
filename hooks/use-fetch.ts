import { useState, useCallback } from "react";
import { toast } from "sonner";

type UseFetchResult<T, Args extends unknown[]> = {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  fn: (...args: Args) => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
};

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
      } catch (error) {
        const err = error as Error;
        setError(err);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    },
    [cb]
  );

  return { data, loading, error, fn, setData };
};

export default useFetch;

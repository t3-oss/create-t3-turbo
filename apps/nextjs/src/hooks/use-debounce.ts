import { useEffect, useState } from "react";

/**
 * Debounce a value — useful for search inputs that trigger API calls.
 *
 * Usage:
 *   const [search, setSearch] = useState("");
 *   const debouncedSearch = useDebounce(search, 300);
 *
 *   // Only fires tRPC query when user stops typing for 300ms
 *   const { data } = trpc.user.search.useQuery({ q: debouncedSearch });
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

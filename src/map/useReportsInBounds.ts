import { useQuery } from "@tanstack/react-query";

import { getReportsInBounds, type Bounds } from "@/services/reportsService";

export function useReportsInBounds(bounds: Bounds | null) {
  return useQuery({
    queryKey: ["reports", bounds],
    queryFn: () => getReportsInBounds(bounds as Bounds),
    enabled: bounds !== null,
  });
}

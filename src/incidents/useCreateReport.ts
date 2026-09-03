import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createReport } from "@/services/reportsService";

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

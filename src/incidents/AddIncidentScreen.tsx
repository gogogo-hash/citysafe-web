import { useState } from "react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReport } from "@/incidents/useCreateReport";
import type { IncidentCategory } from "@/types/report";

const CATEGORIES: IncidentCategory[] = [
  "Suspicious Person",
  "Vandalism",
  "Theft",
  "Noise Complaint",
];

interface FormValues {
  category: IncidentCategory | "";
  description: string;
}

interface PinnedLocation {
  lat: number;
  lng: number;
}

export default function AddIncidentScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const createReport = useCreateReport();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    defaultValues: { category: "", description: "" },
  });

  const pin = (location.state as PinnedLocation | null) ?? null;

  if (!pin) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground">
          Drop a pin on the map first to report an incident there.
        </p>
        <Button onClick={() => navigate("/")}>Go to Map</Button>
      </div>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await createReport.mutateAsync({
        lat: pin.lat,
        lng: pin.lng,
        // Guaranteed non-empty by the "required" rule on this field.
        category: values.category as IncidentCategory,
        description: values.description.trim(),
        createdBy: user?.displayName ?? "anonymous",
      });
      navigate("/");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Couldn't submit report. Please try again."
      );
    }
  });

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Report Incident</h1>
          <p className="text-muted-foreground text-sm">
            {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate("/")}
          aria-label="Cancel and return to map"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="category"
            rules={{ required: "Please select a category." }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            rules={{
              validate: (value) => value.trim().length > 0 || "Please describe what happened.",
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="What did you see?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {submitError && <p className="text-destructive text-sm">{submitError}</p>}

          <Button type="submit" disabled={createReport.isPending}>
            {createReport.isPending ? "Submitting…" : "Submit Report"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

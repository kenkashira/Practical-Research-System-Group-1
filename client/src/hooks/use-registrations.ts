import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertRegistration, Registration } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useRegistrations() {
  return useQuery({
    queryKey: [api.registrations.list.path],
    queryFn: async () => {
      const res = await fetch(api.registrations.list.path);
      if (!res.ok) throw new Error("Failed to fetch registrations");
      return api.registrations.list.responses[200].parse(await res.json());
    },
  });
}

export function useRegistration(id: number) {
  return useQuery({
    queryKey: [api.registrations.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.registrations.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch registration");
      return api.registrations.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateRegistration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertRegistration) => {
      const validated = api.registrations.create.input.parse(data);
      const res = await fetch(api.registrations.create.path, {
        method: api.registrations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create registration");
      }
      return api.registrations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.registrations.list.path] });
      toast({ title: "Success", description: "Registration submitted successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

export function useUpdateRegistration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertRegistration> & { status?: string, remarks?: string }) => {
      const url = buildUrl(api.registrations.update.path, { id });
      const res = await fetch(url, {
        method: api.registrations.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update registration");
      return api.registrations.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.registrations.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.registrations.get.path] });
      toast({ title: "Updated", description: "Registration updated successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    },
  });
}

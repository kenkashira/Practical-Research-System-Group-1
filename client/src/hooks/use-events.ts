import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertEvent, Event } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useEvents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: events, isLoading, error } = useQuery({
    queryKey: [api.events.list.path],
    queryFn: async () => {
      const res = await fetch(api.events.list.path);
      if (!res.ok) throw new Error("Failed to fetch events");
      // JSON dates come back as strings, relying on Zod to coerce if schema uses z.coerce.date()
      // Schema defines 'timestamp', so we should manually parse dates if Zod doesn't auto-coerce from JSON string.
      // But standard JSON.parse leaves them as strings.
      // We'll handle Date parsing in the component or via a transform here.
      const data = await res.json();
      return api.events.list.responses[200].parse(data).map(event => ({
        ...event,
        date: new Date(event.date),
        deadline: new Date(event.deadline)
      }));
    },
  });

  return { events, isLoading, error };
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: [api.events.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.events.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch event");
      const data = await res.json();
      const event = api.events.get.responses[200].parse(data);
      return {
        ...event,
        date: new Date(event.date),
        deadline: new Date(event.deadline)
      };
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertEvent) => {
      // Ensure numeric fee
      const payload = { ...data, fee: Number(data.fee) };
      // Zod schema expects Date objects for date/deadline fields
      // But we need to be careful about JSON serialization if api.events.create.input.parse is used
      // Let's check shared/schema.ts and shared/routes.ts
      const validated = api.events.create.input.parse(payload);
      
      const res = await fetch(api.events.create.path, {
        method: api.events.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create event");
      }
      return api.events.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Success", description: "Event created successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.events.delete.path, { id });
      const res = await fetch(url, { method: api.events.delete.method });
      if (!res.ok) throw new Error("Failed to delete event");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
      toast({ title: "Deleted", description: "Event removed successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide border shadow-sm",
        status === "Pending" && "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
        status === "Approved" && "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
        status === "Rejected" && "bg-red-100 text-red-800 border-red-200 hover:bg-red-100"
      )}
      variant="outline"
    >
      {status}
    </Badge>
  );
}

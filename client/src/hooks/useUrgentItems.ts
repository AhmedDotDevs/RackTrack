import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

interface UrgentItem {
  id: string;
  componentId: string;
  severity: 'red' | 'amber';
  isOverdue: boolean;
}

export function useUrgentItems() {
  const { isAuthenticated } = useAuth();

  const { data: urgentItems = [] } = useQuery<UrgentItem[]>({
    queryKey: ["/api/dashboard/urgent-inspections"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const urgentCount = urgentItems.length;
  const overdueCount = urgentItems.filter(item => item.isOverdue).length;
  const immediateCount = urgentItems.filter(item => item.severity === 'red').length;

  return {
    urgentItems,
    urgentCount,
    overdueCount,
    immediateCount,
  };
}

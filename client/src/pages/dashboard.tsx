import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalComponents: number;
  immediateThreats: number;
  fix4Weeks: number;
  monitorOnly: number;
}

interface UrgentInspection {
  id: string;
  componentId: string;
  defectType: string;
  customDefect?: string;
  severity: 'red' | 'amber' | 'green';
  dueDate?: string;
  isOverdue: boolean;
}

interface RecentActivity {
  id: string;
  componentId: string;
  defectType: string;
  customDefect?: string;
  severity: 'red' | 'amber' | 'green';
  inspectorName: string;
  inspectionDate: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    }
  });

  const { data: urgentInspections, isLoading: urgentLoading } = useQuery<UrgentInspection[]>({
    queryKey: ["/api/dashboard/urgent-inspections"],
    enabled: isAuthenticated,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ["/api/dashboard/recent-activity"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  const getSeverityBadge = (severity: string) => {
    const variants = {
      red: "destructive",
      amber: "secondary", 
      green: "default"
    } as const;
    
    const labels = {
      red: "Immediate",
      amber: "4 Weeks",
      green: "Monitor"
    } as const;

    return (
      <Badge variant={variants[severity as keyof typeof variants]} data-testid={`badge-severity-${severity}`}>
        {labels[severity as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar currentPage="dashboard" />
        
        <main className="flex-1 ml-16 lg:ml-64 transition-all duration-300">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-page-title">
                Dashboard Overview
              </h2>
              <p className="text-gray-600" data-testid="text-page-description">
                Monitor warehouse inspection status and urgent items
              </p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card data-testid="card-immediate-threats">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-8" />
                    ) : (
                      <span className="text-2xl font-bold text-red-600" data-testid="text-immediate-count">
                        {stats?.immediateThreats || 0}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Immediate Threats</h3>
                  <p className="text-sm text-gray-600">Fix now</p>
                </CardContent>
              </Card>
              
              <Card data-testid="card-fix-4-weeks">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-8" />
                    ) : (
                      <span className="text-2xl font-bold text-yellow-600" data-testid="text-amber-count">
                        {stats?.fix4Weeks || 0}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Fix Within 4 Weeks</h3>
                  <p className="text-sm text-gray-600">Amber status</p>
                </CardContent>
              </Card>
              
              <Card data-testid="card-monitor-only">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-8" />
                    ) : (
                      <span className="text-2xl font-bold text-green-600" data-testid="text-green-count">
                        {stats?.monitorOnly || 0}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Monitor Only</h3>
                  <p className="text-sm text-gray-600">Green status</p>
                </CardContent>
              </Card>
              
              <Card data-testid="card-total-components">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-8" />
                    ) : (
                      <span className="text-2xl font-bold text-blue-600" data-testid="text-total-count">
                        {stats?.totalComponents || 0}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">Total Components</h3>
                  <p className="text-sm text-gray-600">Last inspected</p>
                </CardContent>
              </Card>
            </div>

            {/* Urgent Items Table */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle data-testid="text-urgent-items-title">Urgent Items Requiring Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="table-urgent-items">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Component ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Defect</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Severity</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Due Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {urgentLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i}>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-6 w-16" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                          </tr>
                        ))
                      ) : urgentInspections?.length ? (
                        urgentInspections.map((inspection) => (
                          <tr key={inspection.id} className="border-b" data-testid={`row-urgent-${inspection.componentId}`}>
                            <td className="py-3 px-4 font-medium" data-testid={`text-component-id-${inspection.componentId}`}>
                              {inspection.componentId}
                            </td>
                            <td className="py-3 px-4" data-testid={`text-defect-${inspection.componentId}`}>
                              {inspection.defectType === 'custom' ? inspection.customDefect : inspection.defectType.replace('_', ' ')}
                            </td>
                            <td className="py-3 px-4">
                              {getSeverityBadge(inspection.severity)}
                            </td>
                            <td className={`py-3 px-4 ${inspection.isOverdue ? 'text-red-600 font-medium' : ''}`} data-testid={`text-due-date-${inspection.componentId}`}>
                              {inspection.isOverdue ? 'Overdue' : inspection.dueDate || '-'}
                            </td>
                            <td className="py-3 px-4">
                              <button className="text-blue-600 hover:text-blue-800 font-medium" data-testid={`link-view-details-${inspection.componentId}`}>
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500" data-testid="text-no-urgent-items">
                            No urgent items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle data-testid="text-recent-activity-title">Recent Inspection Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="list-recent-activity">
                  {activityLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Skeleton className="w-2 h-2 rounded-full mt-2" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))
                  ) : recentActivity?.length ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3" data-testid={`item-activity-${activity.componentId}`}>
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.severity === 'red' ? 'bg-red-500' :
                          activity.severity === 'amber' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900" data-testid={`text-activity-description-${activity.componentId}`}>
                            {activity.componentId} - {activity.defectType === 'custom' ? activity.customDefect : activity.defectType.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500" data-testid={`text-activity-meta-${activity.componentId}`}>
                            Inspector: {activity.inspectorName} • {new Date(activity.inspectionDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500" data-testid="text-no-recent-activity">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

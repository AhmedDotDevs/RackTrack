import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import WarehouseCanvas from "@/components/warehouse/canvas";
import InspectionPanel from "@/components/inspection/inspection-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface WarehouseComponent {
  id: string;
  layoutId: string;
  componentType: 'rack' | 'beam' | 'upright';
  xPosition: number;
  yPosition: number;
  width: number;
  height: number;
  status: 'good' | 'monitor' | 'fix_4_weeks' | 'immediate';
}

interface Inspection {
  id: string;
  componentId: string;
  defectType: string;
  customDefect?: string;
  severity: 'red' | 'amber' | 'green';
  notes?: string;
  inspectionDate: string;
  inspectorName: string;
}

export default function Inspection() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedComponent, setSelectedComponent] = useState<WarehouseComponent | null>(null);
  const [activeLayoutId] = useState<string>("default"); // For demo purposes

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

  const { data: components } = useQuery<WarehouseComponent[]>({
    queryKey: ["/api/layouts", activeLayoutId, "components"],
    enabled: isAuthenticated && !!activeLayoutId,
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
      }
    }
  });

  const { data: recentInspections, isLoading: inspectionsLoading } = useQuery<Inspection[]>({
    queryKey: ["/api/inspections"],
    enabled: isAuthenticated,
  });

  const createInspectionMutation = useMutation({
    mutationFn: async (inspectionData: {
      componentId: string;
      defectType: string;
      customDefect?: string;
      severity: 'red' | 'amber' | 'green';
      notes?: string;
    }) => {
      return await apiRequest("POST", "/api/inspections", inspectionData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inspection saved successfully",
      });
      queryClient.invalidateQueries(["/api/inspections"]);
      queryClient.invalidateQueries(["/api/layouts", activeLayoutId, "components"]);
      setSelectedComponent(null);
    },
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
      toast({
        title: "Error",
        description: "Failed to save inspection",
        variant: "destructive",
      });
    },
  });

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
      <Badge variant={variants[severity as keyof typeof variants]} data-testid={`badge-inspection-severity-${severity}`}>
        {labels[severity as keyof typeof labels]}
      </Badge>
    );
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar currentPage="inspection" />
        
        <main className="flex-1 ml-16 lg:ml-64 transition-all duration-300">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-page-title">
                Inspection Workflow
              </h2>
              <p className="text-gray-600" data-testid="text-page-description">
                Conduct inspections and mark defects on warehouse components
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Layout View */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle data-testid="text-layout-title">
                      Warehouse Layout - Click components to inspect
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="relative" style={{ height: '500px' }}>
                      <WarehouseCanvas
                        components={components || []}
                        onComponentSelect={setSelectedComponent}
                        isInspectionMode={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Inspection Panel */}
              <div className="lg:col-span-1">
                <InspectionPanel
                  selectedComponent={selectedComponent}
                  onInspectionSubmit={(inspectionData) => {
                    createInspectionMutation.mutate(inspectionData);
                  }}
                  isSubmitting={createInspectionMutation.isLoading}
                />
              </div>
            </div>

            {/* Recent Inspections */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle data-testid="text-recent-inspections-title">Recent Inspections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="table-recent-inspections">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Component</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Defect</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Severity</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Inspector</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectionsLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i}>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-6 w-16" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                          </tr>
                        ))
                      ) : recentInspections?.length ? (
                        recentInspections.map((inspection) => (
                          <tr key={inspection.id} className="border-b" data-testid={`row-inspection-${inspection.componentId}`}>
                            <td className="py-3 px-4" data-testid={`text-inspection-date-${inspection.componentId}`}>
                              {new Date(inspection.inspectionDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 font-medium" data-testid={`text-inspection-component-${inspection.componentId}`}>
                              {inspection.componentId}
                            </td>
                            <td className="py-3 px-4" data-testid={`text-inspection-defect-${inspection.componentId}`}>
                              {inspection.defectType === 'custom' ? inspection.customDefect : inspection.defectType.replace('_', ' ')}
                            </td>
                            <td className="py-3 px-4">
                              {getSeverityBadge(inspection.severity)}
                            </td>
                            <td className="py-3 px-4" data-testid={`text-inspection-inspector-${inspection.componentId}`}>
                              {inspection.inspectorName}
                            </td>
                            <td className="py-3 px-4">
                              <button 
                                className="text-blue-600 hover:text-blue-800 font-medium"
                                data-testid={`button-edit-inspection-${inspection.componentId}`}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500" data-testid="text-no-recent-inspections">
                            No recent inspections found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

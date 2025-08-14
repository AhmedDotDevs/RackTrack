import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import WarehouseCanvas from "@/components/warehouse/canvas";
import ComponentProperties from "@/components/warehouse/component-properties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WarehouseLayout {
  id: string;
  name: string;
  description?: string;
}

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

export default function LayoutEditor() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedComponent, setSelectedComponent] = useState<WarehouseComponent | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);

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

  const { data: layouts = [] } = useQuery<WarehouseLayout[]>({
    queryKey: ["/api/layouts"],
    enabled: isAuthenticated,
  });

  // Set active layout when layouts are loaded
  useEffect(() => {
    if (layouts && Array.isArray(layouts) && layouts.length > 0 && !activeLayoutId) {
      setActiveLayoutId(layouts[0].id);
    }
  }, [layouts, activeLayoutId]);

  const { data: components = [] } = useQuery<WarehouseComponent[]>({
    queryKey: ["/api/layouts", activeLayoutId || 'default', "components"],
    enabled: isAuthenticated,
    retry: 1,
  });

  const saveLayoutMutation = useMutation({
    mutationFn: async (componentsData: WarehouseComponent[]) => {
      if (!activeLayoutId) throw new Error("No active layout");
      return await apiRequest("POST", `/api/layouts/${activeLayoutId}/components/bulk`, {
        components: componentsData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Layout saved successfully",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/layouts", activeLayoutId, "components"] 
      });
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
        description: "Failed to save layout",
        variant: "destructive",
      });
    },
  });

  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await fetch('/api/layouts/import-csv', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Import failed');

      const result = await response.json();
      toast({
        title: "Success",
        description: "Layout imported successfully",
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ["/api/layouts"] 
      });
      setActiveLayoutId(result.layoutId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import CSV",
        variant: "destructive",
      });
    }
  };

  const handleCsvExport = () => {
    if (!activeLayoutId) return;
    window.open(`/api/layouts/${activeLayoutId}/export-csv`, '_blank');
  };

  const addComponent = async (type: 'rack' | 'beam' | 'upright') => {
    if (!activeLayoutId) {
      toast({
        title: "Error",
        description: "Please select a layout first",
        variant: "destructive",
      });
      return;
    }
    
    const newComponent = {
      id: `${type.toUpperCase()}-${Date.now()}`,
      layoutId: activeLayoutId,
      componentType: type,
      xPosition: 100 + Math.random() * 200,
      yPosition: 100 + Math.random() * 200,
      width: type === 'rack' ? 200 : type === 'beam' ? 160 : 20,
      height: type === 'rack' ? 300 : type === 'beam' ? 20 : 300,
      status: 'good' as const,
    };

    try {
      // Create component via API
      await apiRequest("POST", "/api/components", newComponent);
      
      // Refresh the components list
      queryClient.invalidateQueries({
        queryKey: ["/api/layouts", activeLayoutId, "components"]
      });
      
      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully`,
      });
    } catch (error) {
      console.error("Error adding component:", error);
      toast({
        title: "Error", 
        description: `Failed to add ${type}`,
        variant: "destructive",
      });
    }
  };

  // Set first layout as active if none selected
  useEffect(() => {
    if (layouts?.length && !activeLayoutId) {
      setActiveLayoutId(layouts[0].id);
    }
  }, [layouts, activeLayoutId]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar currentPage="layout-editor" />
        
        <main className="flex-1 ml-16 lg:ml-64 transition-all duration-300">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-page-title">
                Warehouse Layout Editor
              </h2>
              <p className="text-gray-600" data-testid="text-page-description">
                Design and modify warehouse rack layouts
              </p>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => addComponent('rack')}
                    data-testid="button-add-rack"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Rack
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => addComponent('beam')}
                    data-testid="button-add-beam"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    Add Beam
                  </Button>
                  
                  <div className="h-6 border-l border-gray-300" />
                  
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvImport}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      data-testid="input-csv-import"
                    />
                    <Button variant="outline" data-testid="button-import-csv">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Import CSV
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={handleCsvExport}
                    disabled={!activeLayoutId}
                    data-testid="button-export-csv"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </Button>
                </div>
                
                <Button
                  onClick={() => {
                    if (components) {
                      saveLayoutMutation.mutate(components);
                    }
                  }}
                  disabled={saveLayoutMutation.isPending || !components}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-save-layout"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  {saveLayoutMutation.isPending ? 'Saving...' : 'Save Layout'}
                </Button>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900" data-testid="text-canvas-title">
                    Warehouse Layout Canvas
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Zoom:</span>
                    <Button variant="outline" size="sm" data-testid="button-zoom-out">-</Button>
                    <span data-testid="text-zoom-level">100%</span>
                    <Button variant="outline" size="sm" data-testid="button-zoom-in">+</Button>
                  </div>
                </div>
              </div>
              
              <div className="relative" style={{ height: '600px' }}>
                <WarehouseCanvas
                  components={components || []}
                  onComponentSelect={setSelectedComponent}
                  onComponentUpdate={(updatedComponents) => {
                    queryClient.setQueryData(["/api/layouts", activeLayoutId, "components"], updatedComponents);
                  }}
                />
              </div>
            </div>

            {/* Component Properties Panel */}
            {selectedComponent && (
              <ComponentProperties
                component={selectedComponent}
                onUpdate={(updatedComponent) => {
                  setSelectedComponent(updatedComponent);
                  queryClient.setQueryData(
                    ["/api/layouts", activeLayoutId, "components"],
                    (oldComponents: WarehouseComponent[] | undefined) =>
                      oldComponents?.map(comp =>
                        comp.id === updatedComponent.id ? updatedComponent : comp
                      ) || []
                  );
                }}
                onDelete={() => {
                  queryClient.setQueryData(
                    ["/api/layouts", activeLayoutId, "components"],
                    (oldComponents: WarehouseComponent[] | undefined) =>
                      oldComponents?.filter(comp => comp.id !== selectedComponent.id) || []
                  );
                  setSelectedComponent(null);
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

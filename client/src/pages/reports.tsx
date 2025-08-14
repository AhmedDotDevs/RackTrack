import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import ReportPreview from "@/components/reports/report-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface Report {
  id: string;
  reportType: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  generatedBy: string;
  pdfUrl?: string;
}

interface ReportFormData {
  layoutId: string;
  reportType: string;
  dateFrom: string;
  dateTo: string;
  includeLayout: boolean;
  includePhotos: boolean;
  includeInspectorDetails: boolean;
}

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ReportFormData>({
    layoutId: '',
    reportType: 'full',
    dateFrom: '',
    dateTo: '',
    includeLayout: true,
    includePhotos: true,
    includeInspectorDetails: false,
  });

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

  const { data: reports, isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
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
      }
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportData: ReportFormData) => {
      return await apiRequest("POST", "/api/reports", reportData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Report generation started",
      });
      queryClient.invalidateQueries(["/api/reports"]);
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
        description: "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateReportMutation.mutate(formData);
  };

  const getReportTypeLabel = (type: string) => {
    const labels = {
      full: 'Full Inspection',
      defects: 'Defects Summary',
      urgent: 'Urgent Items',
      compliance: 'Compliance Certificate'
    } as const;
    return labels[type as keyof typeof labels] || type;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-16">
        <Sidebar currentPage="reports" />
        
        <main className="flex-1 ml-16 lg:ml-64 transition-all duration-300">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-page-title">
                Report Generation
              </h2>
              <p className="text-gray-600" data-testid="text-page-description">
                Generate professional PDF inspection reports
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Report Configuration */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle data-testid="text-report-settings-title">Report Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="reportType">Report Type</Label>
                        <Select 
                          value={formData.reportType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Full Inspection Report</SelectItem>
                            <SelectItem value="defects">Defects Summary</SelectItem>
                            <SelectItem value="urgent">Urgent Items Only</SelectItem>
                            <SelectItem value="compliance">Compliance Certificate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="dateRange">Date Range</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            value={formData.dateFrom}
                            onChange={(e) => setFormData(prev => ({ ...prev, dateFrom: e.target.value }))}
                            required
                          />
                          <Input
                            type="date"
                            value={formData.dateTo}
                            onChange={(e) => setFormData(prev => ({ ...prev, dateTo: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Include Sections</Label>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="includeLayout"
                              checked={formData.includeLayout}
                              onCheckedChange={(checked) => 
                                setFormData(prev => ({ ...prev, includeLayout: !!checked }))
                              }
                            />
                            <Label htmlFor="includeLayout">Layout Diagram</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="includePhotos"
                              checked={formData.includePhotos}
                              onCheckedChange={(checked) => 
                                setFormData(prev => ({ ...prev, includePhotos: !!checked }))
                              }
                            />
                            <Label htmlFor="includePhotos">Photos</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="includeInspectorDetails"
                              checked={formData.includeInspectorDetails}
                              onCheckedChange={(checked) => 
                                setFormData(prev => ({ ...prev, includeInspectorDetails: !!checked }))
                              }
                            />
                            <Label htmlFor="includeInspectorDetails">Inspector Details</Label>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={generateReportMutation.isLoading}
                        data-testid="button-generate-report"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {generateReportMutation.isLoading ? 'Generating...' : 'Generate PDF Report'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Report Preview */}
              <div className="lg:col-span-2">
                <ReportPreview formData={formData} />
              </div>
            </div>

            {/* Previous Reports */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle data-testid="text-previous-reports-title">Previous Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="table-previous-reports">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Generated</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Report Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Period</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Generated By</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportsLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={i}>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                            <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                          </tr>
                        ))
                      ) : reports?.length ? (
                        reports.map((report) => (
                          <tr key={report.id} className="border-b" data-testid={`row-report-${report.id}`}>
                            <td className="py-3 px-4" data-testid={`text-report-generated-${report.id}`}>
                              {new Date(report.generatedAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-medium" data-testid={`text-report-type-${report.id}`}>
                              {getReportTypeLabel(report.reportType)}
                            </td>
                            <td className="py-3 px-4" data-testid={`text-report-period-${report.id}`}>
                              {new Date(report.dateFrom).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4" data-testid={`text-report-user-${report.id}`}>
                              {report.generatedBy}
                            </td>
                            <td className="py-3 px-4">
                              {report.pdfUrl && (
                                <a
                                  href={report.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                                  data-testid={`link-download-report-${report.id}`}
                                >
                                  Download
                                </a>
                              )}
                              <button 
                                className="text-gray-500 hover:text-gray-700"
                                data-testid={`button-delete-report-${report.id}`}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500" data-testid="text-no-previous-reports">
                            No previous reports found
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

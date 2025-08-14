import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportFormData {
  layoutId: string;
  reportType: string;
  dateFrom: string;
  dateTo: string;
  includeLayout: boolean;
  includePhotos: boolean;
  includeInspectorDetails: boolean;
}

interface ReportPreviewProps {
  formData: ReportFormData;
}

export default function ReportPreview({ formData }: ReportPreviewProps) {
  const getReportTypeTitle = (type: string) => {
    const titles = {
      full: 'Full Inspection Report',
      defects: 'Defects Summary Report',
      urgent: 'Urgent Items Report',
      compliance: 'Compliance Certificate'
    };
    return titles[type as keyof typeof titles] || 'Inspection Report';
  };

  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-report-preview-title">Report Preview</CardTitle>
      </CardHeader>
      <CardContent className="bg-gray-50 min-h-96">
        <div 
          className="bg-white p-8 shadow-sm rounded-lg max-w-2xl mx-auto"
          data-testid="container-report-preview"
        >
          {/* Report Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1" />
              </svg>
            </div>
            <h1 
              className="text-2xl font-bold text-gray-900 mb-2" 
              data-testid="text-preview-title"
            >
              {getReportTypeTitle(formData.reportType)}
            </h1>
            <p 
              className="text-gray-600" 
              data-testid="text-preview-period"
            >
              Certification Period: {getCurrentMonth()}
            </p>
            {formData.dateFrom && formData.dateTo && (
              <p className="text-sm text-gray-500">
                Report Range: {new Date(formData.dateFrom).toLocaleDateString()} - {new Date(formData.dateTo).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div 
              className="text-center p-4 bg-red-50 border border-red-200 rounded-lg"
              data-testid="card-preview-immediate"
            >
              <div 
                className="text-2xl font-bold text-red-600" 
                data-testid="text-preview-immediate"
              >
                3
              </div>
              <div className="text-sm text-gray-600">Immediate Threats</div>
            </div>
            <div 
              className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              data-testid="card-preview-amber"
            >
              <div 
                className="text-2xl font-bold text-yellow-600" 
                data-testid="text-preview-amber"
              >
                12
              </div>
              <div className="text-sm text-gray-600">4 Week Fixes</div>
            </div>
            <div 
              className="text-center p-4 bg-green-50 border border-green-200 rounded-lg"
              data-testid="card-preview-green"
            >
              <div 
                className="text-2xl font-bold text-green-600" 
                data-testid="text-preview-green"
              >
                45
              </div>
              <div className="text-sm text-gray-600">Monitor Only</div>
            </div>
          </div>

          {/* Layout Overview */}
          {formData.includeLayout && (
            <div className="mb-6">
              <h3 
                className="font-semibold text-gray-900 mb-3" 
                data-testid="text-preview-layout-title"
              >
                Layout Overview
              </h3>
              <div 
                className="bg-gray-100 h-32 rounded-lg flex items-center justify-center text-gray-500"
                data-testid="placeholder-layout-diagram"
              >
                Layout diagram will be rendered here
              </div>
            </div>
          )}

          {/* Critical Defects */}
          {(formData.reportType === 'full' || formData.reportType === 'defects' || formData.reportType === 'urgent') && (
            <div className="mb-6">
              <h3 
                className="font-semibold text-gray-900 mb-3" 
                data-testid="text-preview-defects-title"
              >
                {formData.reportType === 'urgent' ? 'Urgent Items' : 'Critical Defects'}
              </h3>
              <div className="space-y-2 text-sm" data-testid="list-preview-defects">
                <div 
                  className="flex justify-between items-center p-2 bg-red-50 border border-red-200 rounded"
                  data-testid="item-preview-defect-1"
                >
                  <span>RK-A1-B3: Bent upright</span>
                  <span className="text-red-600 font-medium">Immediate</span>
                </div>
                <div 
                  className="flex justify-between items-center p-2 bg-red-50 border border-red-200 rounded"
                  data-testid="item-preview-defect-2"
                >
                  <span>RK-C1-B2: Loose connections</span>
                  <span className="text-red-600 font-medium">Immediate</span>
                </div>
                {formData.reportType !== 'urgent' && (
                  <div className="flex justify-between items-center p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <span>RK-B3-B1: Surface corrosion</span>
                    <span className="text-yellow-600 font-medium">4 Weeks</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inspector Details */}
          {formData.includeInspectorDetails && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Inspector Information</h3>
              <div className="text-sm text-gray-600">
                <p>Lead Inspector: John Doe</p>
                <p>Certification: CERT-001</p>
                <p>Inspection Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {/* Photos Section */}
          {formData.includePhotos && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Photographic Evidence</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 h-24 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                  Photo 1
                </div>
                <div className="bg-gray-100 h-24 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                  Photo 2
                </div>
              </div>
            </div>
          )}

          {/* Report Footer */}
          <div className="text-center text-sm text-gray-500 pt-6 border-t border-gray-200">
            <p>Generated on {new Date().toLocaleDateString()}</p>
            <p className="mt-1">Warehouse Inspection System v1.0</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

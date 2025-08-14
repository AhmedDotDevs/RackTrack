import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="text-welcome-title">
              Warehouse Inspection System
            </h1>
            <p className="text-gray-600" data-testid="text-welcome-description">
              Professional pallet racking inspection and certification management
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="button-login"
            >
              Login to Continue
            </Button>
            
            <div className="text-sm text-gray-500" data-testid="text-features">
              <p className="mb-2">Features:</p>
              <ul className="text-left space-y-1">
                <li>• Interactive warehouse layout editor</li>
                <li>• Defect tracking and severity management</li>
                <li>• Automated PDF report generation</li>
                <li>• Role-based access control</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

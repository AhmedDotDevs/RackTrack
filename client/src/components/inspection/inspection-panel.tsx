import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface WarehouseComponent {
  id: string;
  componentType: 'rack' | 'beam' | 'upright';
  status: 'good' | 'monitor' | 'fix_4_weeks' | 'immediate';
}

interface InspectionData {
  componentId: string;
  defectType: string;
  customDefect?: string;
  severity: 'red' | 'amber' | 'green';
  notes?: string;
}

interface InspectionPanelProps {
  selectedComponent: WarehouseComponent | null;
  onInspectionSubmit: (data: InspectionData) => void;
  isSubmitting?: boolean;
}

const defectTypes = [
  { value: 'bent_upright', label: 'Bent Upright' },
  { value: 'damaged_beam', label: 'Damaged Beam' },
  { value: 'loose_connections', label: 'Loose Connections' },
  { value: 'corrosion', label: 'Corrosion/Rust' },
  { value: 'missing_components', label: 'Missing Components' },
  { value: 'overloading', label: 'Overloading' },
  { value: 'custom', label: 'Custom Defect' }
];

const severityLevels = [
  { 
    value: 'green', 
    label: 'Monitor - No immediate action required',
    color: 'text-green-600'
  },
  { 
    value: 'amber', 
    label: 'Fix within 4 weeks',
    color: 'text-yellow-600'
  },
  { 
    value: 'red', 
    label: 'Immediate threat - Fix now',
    color: 'text-red-600'
  }
];

export default function InspectionPanel({ 
  selectedComponent, 
  onInspectionSubmit, 
  isSubmitting = false 
}: InspectionPanelProps) {
  const [formData, setFormData] = useState<InspectionData>({
    componentId: '',
    defectType: '',
    customDefect: '',
    severity: 'green',
    notes: ''
  });

  const [showCustomDefect, setShowCustomDefect] = useState(false);

  useEffect(() => {
    if (selectedComponent) {
      setFormData(prev => ({
        ...prev,
        componentId: selectedComponent.id
      }));
    }
  }, [selectedComponent]);

  const handleDefectTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      defectType: value,
      customDefect: value === 'custom' ? prev.customDefect : ''
    }));
    setShowCustomDefect(value === 'custom');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedComponent || !formData.defectType || !formData.severity) {
      return;
    }

    onInspectionSubmit(formData);
    
    // Reset form
    setFormData({
      componentId: '',
      defectType: '',
      customDefect: '',
      severity: 'green',
      notes: ''
    });
    setShowCustomDefect(false);
  };

  if (!selectedComponent) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8" data-testid="message-no-selection">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <p className="text-gray-500">Click on a component in the layout to begin inspection</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-inspection-title">Component Inspection</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="selected-component">Component ID</Label>
            <Input
              id="selected-component"
              value={selectedComponent.id}
              readOnly
              className="bg-gray-50"
              data-testid="input-selected-component"
            />
          </div>

          <div>
            <Label htmlFor="defect-type">Defect Type</Label>
            <Select 
              value={formData.defectType}
              onValueChange={handleDefectTypeChange}
              required
            >
              <SelectTrigger data-testid="select-defect-type">
                <SelectValue placeholder="Select defect type..." />
              </SelectTrigger>
              <SelectContent>
                {defectTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showCustomDefect && (
            <div>
              <Label htmlFor="custom-defect">Custom Defect Description</Label>
              <Input
                id="custom-defect"
                value={formData.customDefect}
                onChange={(e) => setFormData(prev => ({ ...prev, customDefect: e.target.value }))}
                placeholder="Describe the custom defect"
                required={showCustomDefect}
                data-testid="input-custom-defect"
              />
            </div>
          )}

          <div>
            <Label>Severity Level</Label>
            <RadioGroup 
              value={formData.severity}
              onValueChange={(value: 'red' | 'amber' | 'green') => 
                setFormData(prev => ({ ...prev, severity: value }))
              }
              className="mt-2"
            >
              {severityLevels.map((level) => (
                <div key={level.value} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={level.value} 
                    id={level.value}
                    data-testid={`radio-severity-${level.value}`}
                  />
                  <Label 
                    htmlFor={level.value}
                    className={`text-sm ${level.color}`}
                  >
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      level.value === 'green' ? 'bg-green-500' :
                      level.value === 'amber' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    {level.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional inspection notes..."
              rows={3}
              data-testid="textarea-notes"
            />
          </div>

          <div>
            <Label>Photos</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-gray-500">Click to upload photos</p>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden"
                data-testid="input-photos"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !formData.defectType || !formData.severity}
            className="w-full bg-blue-600 hover:bg-blue-700"
            data-testid="button-save-inspection"
          >
            {isSubmitting ? 'Saving...' : 'Save Inspection'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

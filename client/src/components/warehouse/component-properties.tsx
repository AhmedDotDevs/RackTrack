import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

interface ComponentPropertiesProps {
  component: WarehouseComponent;
  onUpdate: (component: WarehouseComponent) => void;
  onDelete: () => void;
}

export default function ComponentProperties({ 
  component, 
  onUpdate, 
  onDelete 
}: ComponentPropertiesProps) {
  const [formData, setFormData] = useState({
    id: component.id,
    componentType: component.componentType,
    status: component.status
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData = {
      id: formData.id,
      componentType: formData.componentType,
      status: formData.status,
      xPosition: component.xPosition,
      yPosition: component.yPosition,
      width: component.width,
      height: component.height,
      layoutId: component.layoutId
    };
    
    try {
      // Update component via API
      const response = await fetch(`/api/components/${component.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update component');
      }

      const updatedComponent = await response.json();
      onUpdate(updatedComponent);
      alert('Component updated successfully!');
    } catch (error) {
      console.error('Error updating component:', error);
      alert('Failed to update component: ' + (error as Error).message);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="mt-6" data-testid="component-properties-panel">
      <CardHeader>
        <CardTitle data-testid="text-properties-title">Component Properties</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="component-id">Component ID</Label>
              <Input
                id="component-id"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                placeholder="RK-A1-B1"
                data-testid="input-component-id"
              />
            </div>
            
            <div>
              <Label htmlFor="component-type">Type</Label>
              <Select 
                value={formData.componentType}
                onValueChange={(value) => handleInputChange('componentType', value)}
              >
                <SelectTrigger data-testid="select-component-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rack">Rack</SelectItem>
                  <SelectItem value="beam">Beam</SelectItem>
                  <SelectItem value="upright">Upright</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="component-status">Status</Label>
              <Select 
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger data-testid="select-component-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="monitor">Monitor</SelectItem>
                  <SelectItem value="fix_4_weeks">Fix Within 4 Weeks</SelectItem>
                  <SelectItem value="immediate">Immediate Threat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              data-testid="button-delete-component"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
            <Button 
              type="submit"
              data-testid="button-update-component"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Update
            </Button>
          </div>
        </form>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Position:</span>
              <div>X: {Math.round(component.xPosition)}px</div>
              <div>Y: {Math.round(component.yPosition)}px</div>
            </div>
            <div>
              <span className="font-medium">Dimensions:</span>
              <div>W: {component.width}px</div>
              <div>H: {component.height}px</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

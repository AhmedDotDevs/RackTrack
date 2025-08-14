// Inspection workflow JavaScript
class InspectionManager {
    constructor() {
        this.selectedComponent = null;
        this.canvas = null;
        this.stage = null;
        this.layer = null;
        this.components = new Map();
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        const canvasContainer = document.getElementById('inspection-canvas');
        if (canvasContainer) {
            this.initCanvas(canvasContainer);
        }
        
        this.loadComponents();
    }
    
    initCanvas(container) {
        this.stage = new Konva.Stage({
            container: 'inspection-canvas',
            width: container.offsetWidth,
            height: 500,
            draggable: false
        });
        
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (container) {
                this.stage.width(container.offsetWidth);
                this.stage.draw();
            }
        });
    }
    
    loadComponents() {
        // This would typically load from backend
        const sampleComponents = [
            { id: 'A1', type: 'rack', x: 50, y: 50, width: 80, height: 60, status: 'good' },
            { id: 'A2', type: 'rack', x: 150, y: 50, width: 80, height: 60, status: 'fix_4_weeks' },
            { id: 'A3', type: 'rack', x: 250, y: 50, width: 80, height: 60, status: 'immediate' },
            { id: 'B1', type: 'rack', x: 50, y: 130, width: 80, height: 60, status: 'good' },
            { id: 'B2', type: 'rack', x: 150, y: 130, width: 80, height: 60, status: 'good' },
            { id: 'B3', type: 'rack', x: 250, y: 130, width: 80, height: 60, status: 'fix_4_weeks' }
        ];
        
        sampleComponents.forEach(component => {
            this.addComponentToCanvas(component);
        });
    }
    
    addComponentToCanvas(componentData) {
        const { id, type, x, y, width, height, status } = componentData;
        
        const group = new Konva.Group({
            x: x,
            y: y,
            id: id
        });
        
        const rect = new Konva.Rect({
            width: width,
            height: height,
            fill: this.getStatusColor(status),
            stroke: this.getStatusBorderColor(status),
            strokeWidth: 2,
            cornerRadius: 4
        });
        
        const text = new Konva.Text({
            x: 5,
            y: height / 2 - 8,
            text: id,
            fontSize: 12,
            fontFamily: 'Arial',
            fill: '#000',
            width: width - 10,
            align: 'center'
        });
        
        // Status indicator
        const statusIcon = this.getStatusIcon(status);
        if (statusIcon) {
            const iconText = new Konva.Text({
                x: width - 20,
                y: 5,
                text: statusIcon,
                fontSize: 14,
                fontFamily: 'Arial',
                fill: this.getStatusBorderColor(status)
            });
            group.add(iconText);
        }
        
        group.add(rect);
        group.add(text);
        
        // Add click handler for inspection
        group.on('click tap', () => {
            this.selectComponentForInspection(componentData);
        });
        
        group.on('mouseenter', () => {
            document.body.style.cursor = 'pointer';
            rect.stroke('#007bff');
            rect.strokeWidth(3);
            this.layer.draw();
        });
        
        group.on('mouseleave', () => {
            document.body.style.cursor = 'default';
            rect.stroke(this.getStatusBorderColor(status));
            rect.strokeWidth(2);
            this.layer.draw();
        });
        
        this.layer.add(group);
        this.components.set(id, { group, data: componentData });
        this.layer.draw();
    }
    
    selectComponentForInspection(componentData) {
        this.selectedComponent = componentData;
        this.showInspectionPanel(componentData);
        this.highlightSelectedComponent(componentData.id);
    }
    
    highlightSelectedComponent(id) {
        // Reset all components
        this.components.forEach((component) => {
            const rect = component.group.findOne('Rect');
            rect.stroke(this.getStatusBorderColor(component.data.status));
            rect.strokeWidth(2);
        });
        
        // Highlight selected component
        const selectedComponent = this.components.get(id);
        if (selectedComponent) {
            const rect = selectedComponent.group.findOne('Rect');
            rect.stroke('#007bff');
            rect.strokeWidth(4);
        }
        
        this.layer.draw();
    }
    
    showInspectionPanel(componentData) {
        const noSelection = document.getElementById('no-selection');
        const inspectionForm = document.getElementById('inspection-form');
        
        if (noSelection) noSelection.style.display = 'none';
        if (inspectionForm) {
            inspectionForm.style.display = 'block';
            document.getElementById('selected-component').value = componentData.id;
        }
    }
    
    hideInspectionPanel() {
        const noSelection = document.getElementById('no-selection');
        const inspectionForm = document.getElementById('inspection-form');
        
        if (noSelection) noSelection.style.display = 'block';
        if (inspectionForm) inspectionForm.style.display = 'none';
        
        this.selectedComponent = null;
        
        // Reset component highlighting
        this.components.forEach((component) => {
            const rect = component.group.findOne('Rect');
            rect.stroke(this.getStatusBorderColor(component.data.status));
            rect.strokeWidth(2);
        });
        this.layer.draw();
    }
    
    submitInspection(formData) {
        if (!this.selectedComponent) return;
        
        // Update component status based on inspection severity
        const severity = formData.get('severity');
        let newStatus = 'good';
        
        if (severity === 'red') {
            newStatus = 'immediate';
        } else if (severity === 'amber') {
            newStatus = 'fix_4_weeks';
        } else if (severity === 'green') {
            newStatus = 'monitor';
        }
        
        // Update component visually
        this.updateComponentStatus(this.selectedComponent.id, newStatus);
        
        // Hide inspection panel
        this.hideInspectionPanel();
        
        // Show success message
        this.showSuccessMessage('Inspection saved successfully');
    }
    
    updateComponentStatus(id, status) {
        const component = this.components.get(id);
        if (component) {
            component.data.status = status;
            const rect = component.group.findOne('Rect');
            rect.fill(this.getStatusColor(status));
            rect.stroke(this.getStatusBorderColor(status));
            
            // Update status icon
            const existingIcon = component.group.findOne('.status-icon');
            if (existingIcon) {
                existingIcon.destroy();
            }
            
            const statusIcon = this.getStatusIcon(status);
            if (statusIcon) {
                const iconText = new Konva.Text({
                    x: component.data.width - 20,
                    y: 5,
                    text: statusIcon,
                    fontSize: 14,
                    fontFamily: 'Arial',
                    fill: this.getStatusBorderColor(status),
                    name: 'status-icon'
                });
                component.group.add(iconText);
            }
            
            this.layer.draw();
        }
    }
    
    getStatusColor(status) {
        const colors = {
            'good': '#e8f5e8',
            'monitor': '#e8f5e8',
            'fix_4_weeks': '#fff3cd',
            'immediate': '#f8d7da'
        };
        return colors[status] || '#f8f9fa';
    }
    
    getStatusBorderColor(status) {
        const colors = {
            'good': '#28a745',
            'monitor': '#28a745',
            'fix_4_weeks': '#ffc107',
            'immediate': '#dc3545'
        };
        return colors[status] || '#6c757d';
    }
    
    getStatusIcon(status) {
        const icons = {
            'good': '✓',
            'monitor': '✓',
            'fix_4_weeks': '⚠',
            'immediate': '🚨'
        };
        return icons[status];
    }
    
    showSuccessMessage(message) {
        const resultDiv = document.getElementById('inspection-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="bg-success/10 border border-success rounded-lg p-4 mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-success mr-2"></i>
                        <p class="text-success font-medium">${message}</p>
                    </div>
                </div>
            `;
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                if (resultDiv) resultDiv.innerHTML = '';
            }, 3000);
        }
    }
    
    showErrorMessage(message) {
        const resultDiv = document.getElementById('inspection-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="bg-danger/10 border border-danger rounded-lg p-4 mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-circle text-danger mr-2"></i>
                        <p class="text-danger font-medium">${message}</p>
                    </div>
                </div>
            `;
        }
    }
    
    setupEventListeners() {
        // Defect type change handler
        const defectTypeSelect = document.querySelector('select[name="defect_type"]');
        if (defectTypeSelect) {
            defectTypeSelect.addEventListener('change', (e) => {
                const customField = document.getElementById('custom-defect-field');
                const customInput = customField?.querySelector('input');
                
                if (e.target.value === 'custom') {
                    if (customField) customField.style.display = 'block';
                    if (customInput) customInput.required = true;
                } else {
                    if (customField) customField.style.display = 'none';
                    if (customInput) customInput.required = false;
                }
            });
        }
        
        // Form submission handler
        const inspectionForm = document.getElementById('inspection-form');
        if (inspectionForm) {
            inspectionForm.addEventListener('htmx:afterRequest', (e) => {
                if (e.detail.xhr.status === 200) {
                    this.submitInspection(new FormData(inspectionForm));
                } else {
                    this.showErrorMessage('Failed to save inspection');
                }
            });
        }
        
        // Click outside canvas to deselect
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#inspection-canvas') && 
                !e.target.closest('#inspection-panel')) {
                this.hideInspectionPanel();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideInspectionPanel();
            }
        });
    }
}

// Severity level helper functions
window.inspectionUtils = {
    getSeverityColor(severity) {
        const colors = {
            'red': 'text-danger',
            'amber': 'text-warning',
            'green': 'text-success'
        };
        return colors[severity] || 'text-neutral-500';
    },
    
    getSeverityLabel(severity) {
        const labels = {
            'red': 'Immediate threat - Fix now',
            'amber': 'Fix within 4 weeks',
            'green': 'Monitor - No immediate action required'
        };
        return labels[severity] || severity;
    },
    
    formatDefectType(type) {
        if (type === 'custom') return 'Custom defect';
        
        const types = {
            'bent_upright': 'Bent upright',
            'damaged_beam': 'Damaged beam',
            'loose_connections': 'Loose connections',
            'corrosion': 'Corrosion/rust',
            'missing_components': 'Missing components',
            'overloading': 'Overloading'
        };
        
        return types[type] || type.replace(/_/g, ' ');
    }
};

// Initialize inspection manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('inspection-canvas')) {
        window.inspectionManager = new InspectionManager();
    }
});

console.log('Inspection Manager loaded');

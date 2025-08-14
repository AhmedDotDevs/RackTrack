// Layout Editor with Konva.js integration
class WarehouseLayoutEditor {
    constructor(containerId) {
        this.containerId = containerId;
        this.stage = null;
        this.layer = null;
        this.components = new Map();
        this.selectedComponent = null;
        this.isEditing = false;
        this.scale = 1;
        this.gridSize = 20;
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Canvas container not found');
            return;
        }
        
        // Initialize Konva stage
        this.stage = new Konva.Stage({
            container: this.containerId,
            width: container.offsetWidth,
            height: 600,
            draggable: false
        });
        
        // Create main layer
        this.layer = new Konva.Layer();
        this.stage.add(this.layer);
        
        // Draw grid
        this.drawGrid();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const container = document.getElementById(this.containerId);
            if (container) {
                this.stage.width(container.offsetWidth);
                this.stage.draw();
            }
        });
    }
    
    drawGrid() {
        const width = this.stage.width();
        const height = this.stage.height();
        
        // Vertical lines
        for (let i = 0; i < width / this.gridSize; i++) {
            const line = new Konva.Line({
                points: [i * this.gridSize, 0, i * this.gridSize, height],
                stroke: '#f0f0f0',
                strokeWidth: 1,
                listening: false
            });
            this.layer.add(line);
        }
        
        // Horizontal lines
        for (let i = 0; i < height / this.gridSize; i++) {
            const line = new Konva.Line({
                points: [0, i * this.gridSize, width, i * this.gridSize],
                stroke: '#f0f0f0',
                strokeWidth: 1,
                listening: false
            });
            this.layer.add(line);
        }
    }
    
    addComponent(componentData) {
        const { id, componentType, xPosition, yPosition, width, height, status } = componentData;
        
        // Create component group
        const group = new Konva.Group({
            x: xPosition,
            y: yPosition,
            draggable: true,
            id: id
        });
        
        // Main rectangle
        const rect = new Konva.Rect({
            width: width,
            height: height,
            fill: this.getStatusColor(status),
            stroke: this.getStatusBorderColor(status),
            strokeWidth: 2,
            cornerRadius: 4
        });
        
        // Component label
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
        
        // Type indicator
        const typeIcon = new Konva.Text({
            x: 5,
            y: 5,
            text: this.getTypeIcon(componentType),
            fontSize: 10,
            fontFamily: 'Arial',
            fill: '#666'
        });
        
        group.add(rect);
        group.add(text);
        group.add(typeIcon);
        
        // Add event listeners
        group.on('click tap', () => {
            this.selectComponent(group, componentData);
        });
        
        group.on('dragmove', () => {
            this.snapToGrid(group);
            this.updateComponentPosition(id, group.x(), group.y());
        });
        
        group.on('dragend', () => {
            this.saveComponentPosition(id, group.x(), group.y());
        });
        
        group.on('mouseenter', () => {
            document.body.style.cursor = 'move';
            rect.stroke('#000');
            rect.strokeWidth(3);
            this.layer.draw();
        });
        
        group.on('mouseleave', () => {
            document.body.style.cursor = 'default';
            if (this.selectedComponent !== group) {
                rect.stroke(this.getStatusBorderColor(status));
                rect.strokeWidth(2);
                this.layer.draw();
            }
        });
        
        this.layer.add(group);
        this.components.set(id, { group, data: componentData });
        this.layer.draw();
        
        return group;
    }
    
    removeComponent(id) {
        const component = this.components.get(id);
        if (component) {
            component.group.destroy();
            this.components.delete(id);
            this.layer.draw();
            
            if (this.selectedComponent && this.selectedComponent.id() === id) {
                this.deselectComponent();
            }
        }
    }
    
    selectComponent(group, data) {
        // Deselect previous component
        this.deselectComponent();
        
        // Select new component
        this.selectedComponent = group;
        const rect = group.findOne('Rect');
        rect.stroke('#007bff');
        rect.strokeWidth(3);
        this.layer.draw();
        
        // Show properties panel
        this.showPropertiesPanel(data);
    }
    
    deselectComponent() {
        if (this.selectedComponent) {
            const rect = this.selectedComponent.findOne('Rect');
            const id = this.selectedComponent.id();
            const component = this.components.get(id);
            
            if (component && rect) {
                rect.stroke(this.getStatusBorderColor(component.data.status));
                rect.strokeWidth(2);
            }
            
            this.selectedComponent = null;
            this.hidePropertiesPanel();
            this.layer.draw();
        }
    }
    
    updateComponent(id, updates) {
        const component = this.components.get(id);
        if (!component) return;
        
        // Update data
        component.data = { ...component.data, ...updates };
        
        // Update visual representation
        const group = component.group;
        const rect = group.findOne('Rect');
        const text = group.findOne('Text');
        
        if (updates.status) {
            rect.fill(this.getStatusColor(updates.status));
            rect.stroke(this.getStatusBorderColor(updates.status));
        }
        
        if (updates.id && updates.id !== id) {
            text.text(updates.id);
            group.id(updates.id);
            
            // Update component map
            this.components.delete(id);
            this.components.set(updates.id, component);
        }
        
        this.layer.draw();
    }
    
    snapToGrid(node) {
        const x = Math.round(node.x() / this.gridSize) * this.gridSize;
        const y = Math.round(node.y() / this.gridSize) * this.gridSize;
        node.x(x);
        node.y(y);
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
    
    getTypeIcon(type) {
        const icons = {
            'rack': '⬜',
            'beam': '━',
            'upright': '┃'
        };
        return icons[type] || '■';
    }
    
    showPropertiesPanel(data) {
        const panel = document.getElementById('properties-panel');
        if (panel) {
            panel.style.display = 'block';
            
            // Populate form fields
            document.getElementById('component-id').value = data.id;
            document.getElementById('component-type').value = data.componentType;
            document.getElementById('component-status').value = data.status;
        }
    }
    
    hidePropertiesPanel() {
        const panel = document.getElementById('properties-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }
    
    updateComponentPosition(id, x, y) {
        const component = this.components.get(id);
        if (component) {
            component.data.xPosition = x;
            component.data.yPosition = y;
        }
    }
    
    saveComponentPosition(id, x, y) {
        // This would typically save to backend via HTMX
        console.log(`Saving component ${id} position: ${x}, ${y}`);
    }
    
    loadComponents(componentsData) {
        // Clear existing components
        this.clearComponents();
        
        // Add new components
        componentsData.forEach(component => {
            this.addComponent(component);
        });
    }
    
    clearComponents() {
        this.components.forEach((component) => {
            component.group.destroy();
        });
        this.components.clear();
        this.selectedComponent = null;
        this.layer.draw();
    }
    
    exportLayout() {
        const layoutData = Array.from(this.components.values()).map(component => ({
            ...component.data,
            xPosition: component.group.x(),
            yPosition: component.group.y()
        }));
        
        return layoutData;
    }
    
    zoomIn() {
        this.scale = Math.min(this.scale * 1.1, 2);
        this.stage.scale({ x: this.scale, y: this.scale });
        this.stage.draw();
        this.updateZoomDisplay();
    }
    
    zoomOut() {
        this.scale = Math.max(this.scale * 0.9, 0.5);
        this.stage.scale({ x: this.scale, y: this.scale });
        this.stage.draw();
        this.updateZoomDisplay();
    }
    
    resetZoom() {
        this.scale = 1;
        this.stage.scale({ x: 1, y: 1 });
        this.stage.draw();
        this.updateZoomDisplay();
    }
    
    updateZoomDisplay() {
        const zoomElement = document.getElementById('zoom-level');
        if (zoomElement) {
            zoomElement.textContent = Math.round(this.scale * 100) + '%';
        }
    }
    
    setupEventListeners() {
        // Zoom controls
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => {
            this.zoomIn();
        });
        
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => {
            this.zoomOut();
        });
        
        // Add component buttons
        document.getElementById('add-rack-btn')?.addEventListener('click', () => {
            this.addNewComponent('rack');
        });
        
        document.getElementById('add-beam-btn')?.addEventListener('click', () => {
            this.addNewComponent('beam');
        });
        
        // Component form
        document.getElementById('component-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateSelectedComponent();
        });
        
        document.getElementById('delete-component-btn')?.addEventListener('click', () => {
            this.deleteSelectedComponent();
        });
        
        // Save layout
        document.getElementById('save-layout-btn')?.addEventListener('click', () => {
            this.saveLayout();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedComponent) {
                this.deleteSelectedComponent();
            }
            
            if (e.key === 'Escape') {
                this.deselectComponent();
            }
        });
        
        // Click outside to deselect
        this.stage.on('click tap', (e) => {
            if (e.target === this.stage) {
                this.deselectComponent();
            }
        });
    }
    
    addNewComponent(type) {
        const id = `${type.toUpperCase()}-${Date.now()}`;
        const newComponent = {
            id: id,
            componentType: type,
            xPosition: 50,
            yPosition: 50,
            width: type === 'beam' ? 100 : 80,
            height: type === 'upright' ? 100 : 60,
            status: 'good'
        };
        
        this.addComponent(newComponent);
    }
    
    updateSelectedComponent() {
        if (!this.selectedComponent) return;
        
        const id = this.selectedComponent.id();
        const newId = document.getElementById('component-id').value;
        const type = document.getElementById('component-type').value;
        const status = document.getElementById('component-status').value;
        
        this.updateComponent(id, {
            id: newId,
            componentType: type,
            status: status
        });
    }
    
    deleteSelectedComponent() {
        if (this.selectedComponent) {
            const id = this.selectedComponent.id();
            this.removeComponent(id);
        }
    }
    
    saveLayout() {
        const layoutData = this.exportLayout();
        
        // Send to backend via HTMX
        htmx.ajax('POST', '/api/save-layout/', {
            values: {
                layout_id: this.getCurrentLayoutId(),
                components: JSON.stringify(layoutData)
            },
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        });
    }
    
    getCurrentLayoutId() {
        // Get current layout ID from the page context
        return document.querySelector('[data-layout-id]')?.dataset.layoutId || null;
    }
}

// Initialize layout editor when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('canvas-container')) {
        window.layoutEditor = new WarehouseLayoutEditor('canvas-container');
        
        // Load existing components if available
        const componentsData = window.initialComponents || [];
        if (componentsData.length > 0) {
            window.layoutEditor.loadComponents(componentsData);
        }
    }
});

console.log('Layout Editor loaded');

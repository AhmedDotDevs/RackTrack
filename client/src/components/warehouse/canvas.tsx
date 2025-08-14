import { useEffect, useRef, useState } from "react";
import Konva from "konva";

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

interface WarehouseCanvasProps {
  components: WarehouseComponent[];
  onComponentSelect?: (component: WarehouseComponent) => void;
  onComponentUpdate?: (components: WarehouseComponent[]) => void;
  isInspectionMode?: boolean;
  className?: string;
}

export default function WarehouseCanvas({
  components,
  onComponentSelect,
  onComponentUpdate,
  isInspectionMode = false,
  className = ""
}: WarehouseCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Konva stage
    const stage = new Konva.Stage({
      container: containerRef.current,
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
      draggable: false,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    stageRef.current = stage;
    layerRef.current = layer;

    // Draw grid background
    drawGrid(layer, stage.width(), stage.height());

    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && stage) {
        stage.width(containerRef.current.offsetWidth);
        stage.height(containerRef.current.offsetHeight);
        stage.draw();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      stage.destroy();
    };
  }, []);

  useEffect(() => {
    if (!stageRef.current || !layerRef.current) return;

    const layer = layerRef.current;
    
    // Clear existing components (except grid)
    const componentsToRemove = layer.children.filter(child => 
      child.getClassName() === 'Group' && child.name() === 'component'
    );
    componentsToRemove.forEach(child => child.destroy());

    // Add components
    components.forEach(component => {
      addComponentToCanvas(component, layer);
    });

    layer.draw();
  }, [components]);

  const drawGrid = (layer: Konva.Layer, width: number, height: number) => {
    const gridSize = 20;
    
    // Vertical lines
    for (let i = 0; i <= width / gridSize; i++) {
      const line = new Konva.Line({
        points: [i * gridSize, 0, i * gridSize, height],
        stroke: '#f0f0f0',
        strokeWidth: 1,
        listening: false,
        name: 'grid'
      });
      layer.add(line);
    }
    
    // Horizontal lines
    for (let i = 0; i <= height / gridSize; i++) {
      const line = new Konva.Line({
        points: [0, i * gridSize, width, i * gridSize],
        stroke: '#f0f0f0',
        strokeWidth: 1,
        listening: false,
        name: 'grid'
      });
      layer.add(line);
    }
  };

  const addComponentToCanvas = (component: WarehouseComponent, layer: Konva.Layer) => {
    const group = new Konva.Group({
      x: component.xPosition,
      y: component.yPosition,
      draggable: !isInspectionMode,
      name: 'component',
      id: component.id
    });

    // Main rectangle
    const rect = new Konva.Rect({
      width: component.width,
      height: component.height,
      fill: getStatusColor(component.status),
      stroke: getStatusBorderColor(component.status),
      strokeWidth: 2,
      cornerRadius: 4,
      name: 'rect'
    });

    // Component label
    const text = new Konva.Text({
      x: 5,
      y: component.height / 2 - 8,
      text: component.id,
      fontSize: 12,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#000',
      width: component.width - 10,
      align: 'center',
      name: 'text'
    });

    // Type indicator
    const typeIcon = new Konva.Text({
      x: 5,
      y: 5,
      text: getTypeIcon(component.componentType),
      fontSize: 10,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#666',
      name: 'typeIcon'
    });

    // Status indicator
    const statusIcon = getStatusIcon(component.status);
    if (statusIcon) {
      const statusText = new Konva.Text({
        x: component.width - 20,
        y: 5,
        text: statusIcon,
        fontSize: 14,
        fontFamily: 'Inter, system-ui, sans-serif',
        fill: getStatusBorderColor(component.status),
        name: 'statusIcon'
      });
      group.add(statusText);
    }

    group.add(rect);
    group.add(text);
    group.add(typeIcon);

    // Event listeners
    group.on('click tap', () => {
      selectComponent(component, group);
    });

    if (!isInspectionMode) {
      group.on('dragmove', () => {
        snapToGrid(group);
      });

      group.on('dragend', () => {
        updateComponentPosition(component, group);
      });
    }

    group.on('mouseenter', () => {
      document.body.style.cursor = isInspectionMode ? 'pointer' : 'move';
      rect.stroke('#007bff');
      rect.strokeWidth(3);
      layer.draw();
    });

    group.on('mouseleave', () => {
      document.body.style.cursor = 'default';
      if (selectedComponent !== component.id) {
        rect.stroke(getStatusBorderColor(component.status));
        rect.strokeWidth(2);
        layer.draw();
      }
    });

    layer.add(group);
  };

  const selectComponent = (component: WarehouseComponent, group: Konva.Group) => {
    // Deselect previous component
    if (selectedComponent && layerRef.current) {
      const prevGroup = layerRef.current.findOne(`#${selectedComponent}`) as Konva.Group;
      if (prevGroup) {
        const rect = prevGroup.findOne('.rect') as Konva.Rect;
        if (rect) {
          const prevComp = components.find(c => c.id === selectedComponent);
          if (prevComp) {
            rect.stroke(getStatusBorderColor(prevComp.status));
            rect.strokeWidth(2);
          }
        }
      }
    }

    // Select new component
    setSelectedComponent(component.id);
    const rect = group.findOne('Rect') as Konva.Rect;
    rect.stroke('#007bff');
    rect.strokeWidth(3);
    layerRef.current?.draw();

    onComponentSelect?.(component);
  };

  const snapToGrid = (node: Konva.Group) => {
    const gridSize = 20;
    const x = Math.round(node.x() / gridSize) * gridSize;
    const y = Math.round(node.y() / gridSize) * gridSize;
    node.x(x);
    node.y(y);
  };

  const updateComponentPosition = (component: WarehouseComponent, group: Konva.Group) => {
    const updatedComponent = {
      ...component,
      xPosition: group.x(),
      yPosition: group.y()
    };

    const updatedComponents = components.map(c => 
      c.id === component.id ? updatedComponent : c
    );

    onComponentUpdate?.(updatedComponents);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'good': '#e8f5e8',
      'monitor': '#e8f5e8',
      'fix_4_weeks': '#fff3cd',
      'immediate': '#f8d7da'
    };
    return colors[status as keyof typeof colors] || '#f8f9fa';
  };

  const getStatusBorderColor = (status: string) => {
    const colors = {
      'good': '#28a745',
      'monitor': '#28a745',
      'fix_4_weeks': '#ffc107',
      'immediate': '#dc3545'
    };
    return colors[status as keyof typeof colors] || '#6c757d';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      'rack': '⬜',
      'beam': '━',
      'upright': '┃'
    };
    return icons[type as keyof typeof icons] || '■';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'good': '✓',
      'monitor': '✓',
      'fix_4_weeks': '⚠',
      'immediate': '🚨'
    };
    return icons[status as keyof typeof icons];
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-gray-50 ${className}`}
      data-testid={isInspectionMode ? "canvas-inspection" : "canvas-container"}
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, #f9f9f9, #f9f9f9 20px, transparent 20px, transparent 40px), repeating-linear-gradient(90deg, #f9f9f9, #f9f9f9 20px, transparent 20px, transparent 40px)'
      }}
    />
  );
}

from django import template
from core.models import Inspection, SeverityLevel

register = template.Library()

@register.simple_tag
def urgent_items_count():
    """Return count of urgent inspection items (red and amber severity)."""
    return Inspection.objects.filter(
        severity__in=[SeverityLevel.RED, SeverityLevel.AMBER],
        is_resolved=False
    ).count()

@register.filter
def get_item(dictionary, key):
    """Get item from dictionary by key."""
    return dictionary.get(key)

@register.filter
def multiply(value, arg):
    """Multiply value by argument."""
    try:
        return float(value) * float(arg)
    except (ValueError, TypeError):
        return 0

@register.filter
def severity_color(severity):
    """Return CSS color class for severity level."""
    color_map = {
        'red': 'text-danger',
        'amber': 'text-warning',
        'green': 'text-success'
    }
    return color_map.get(severity, 'text-neutral-500')

@register.filter
def status_color(status):
    """Return CSS color class for component status."""
    color_map = {
        'good': 'text-success',
        'monitor': 'text-success',
        'fix_4_weeks': 'text-warning',
        'immediate': 'text-danger'
    }
    return color_map.get(status, 'text-neutral-500')

@register.filter
def format_defect_type(defect_type):
    """Format defect type for display."""
    if defect_type == 'custom':
        return 'Custom'
    
    return defect_type.replace('_', ' ').title()

@register.filter
def component_type_display(component_type):
    """Format component type for display."""
    type_map = {
        'rack': 'Rack',
        'beam': 'Beam', 
        'upright': 'Upright'
    }
    return type_map.get(component_type, component_type.title())

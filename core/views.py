from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.contrib import messages
from django.utils import timezone
from datetime import datetime, timedelta
import json

from .models import (
    WarehouseLayout, WarehouseComponent, Inspection, UserProfile, 
    Report, Notification, ComponentStatus, SeverityLevel, DefectType
)
from .forms import InspectionForm, ComponentForm, ReportForm


@login_required
def dashboard(request):
    # Get statistics
    total_components = WarehouseComponent.objects.count()
    immediate_threats = WarehouseComponent.objects.filter(status=ComponentStatus.IMMEDIATE).count()
    fix_4_weeks = WarehouseComponent.objects.filter(status=ComponentStatus.FIX_4_WEEKS).count()
    monitor_only = WarehouseComponent.objects.filter(
        status__in=[ComponentStatus.GOOD, ComponentStatus.MONITOR]
    ).count()
    
    # Get urgent items
    urgent_inspections = Inspection.objects.filter(
        Q(severity=SeverityLevel.RED) | Q(severity=SeverityLevel.AMBER),
        is_resolved=False
    ).select_related('component', 'inspector').order_by('inspection_date')[:10]
    
    # Get recent activity
    recent_activity = Inspection.objects.select_related(
        'component', 'inspector'
    ).order_by('-inspection_date')[:5]
    
    context = {
        'total_components': total_components,
        'immediate_threats': immediate_threats,
        'fix_4_weeks': fix_4_weeks,
        'monitor_only': monitor_only,
        'urgent_inspections': urgent_inspections,
        'recent_activity': recent_activity,
    }
    
    if request.htmx:
        return render(request, 'components/dashboard_content.html', context)
    
    return render(request, 'dashboard.html', context)


@login_required
def layout_editor(request):
    layouts = WarehouseLayout.objects.filter(is_active=True)
    active_layout = layouts.first() if layouts.exists() else None
    components = []
    
    if active_layout:
        components = active_layout.components.all()
    
    context = {
        'layouts': layouts,
        'active_layout': active_layout,
        'components': components,
    }
    
    if request.htmx:
        return render(request, 'components/layout_content.html', context)
    
    return render(request, 'layout_editor.html', context)


@login_required
@require_http_methods(["POST"])
def save_layout(request):
    try:
        data = json.loads(request.body)
        layout_id = data.get('layout_id')
        components_data = data.get('components', [])
        
        if layout_id:
            layout = get_object_or_404(WarehouseLayout, id=layout_id)
        else:
            layout = WarehouseLayout.objects.create(
                name=f"Layout {timezone.now().strftime('%Y-%m-%d %H:%M')}",
                created_by=request.user
            )
        
        # Clear existing components
        layout.components.all().delete()
        
        # Create new components
        for comp_data in components_data:
            WarehouseComponent.objects.create(
                id=comp_data['id'],
                layout=layout,
                component_type=comp_data['type'],
                x_position=comp_data['x'],
                y_position=comp_data['y'],
                width=comp_data['width'],
                height=comp_data['height'],
                status=comp_data.get('status', ComponentStatus.GOOD)
            )
        
        return JsonResponse({'success': True, 'layout_id': str(layout.id)})
    
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
def inspection(request):
    layouts = WarehouseLayout.objects.filter(is_active=True)
    active_layout = layouts.first() if layouts.exists() else None
    components = []
    recent_inspections = Inspection.objects.select_related('component', 'inspector').order_by('-inspection_date')[:10]
    
    if active_layout:
        components = active_layout.components.all()
    
    context = {
        'layouts': layouts,
        'active_layout': active_layout,
        'components': components,
        'recent_inspections': recent_inspections,
        'defect_types': DefectType.choices,
        'severity_levels': SeverityLevel.choices,
    }
    
    if request.htmx:
        return render(request, 'components/inspection_content.html', context)
    
    return render(request, 'inspection.html', context)


@login_required
@require_http_methods(["POST"])
def create_inspection(request):
    try:
        component_id = request.POST.get('component_id')
        defect_type = request.POST.get('defect_type')
        custom_defect = request.POST.get('custom_defect', '')
        severity = request.POST.get('severity')
        notes = request.POST.get('notes', '')
        
        component = get_object_or_404(WarehouseComponent, id=component_id)
        
        inspection = Inspection.objects.create(
            component=component,
            inspector=request.user,
            defect_type=defect_type,
            custom_defect=custom_defect,
            severity=severity,
            notes=notes
        )
        
        if request.htmx:
            return render(request, 'components/inspection_success.html', {
                'inspection': inspection
            })
        
        messages.success(request, 'Inspection saved successfully.')
        return redirect('inspection')
    
    except Exception as e:
        if request.htmx:
            return render(request, 'components/inspection_error.html', {
                'error': str(e)
            })
        
        messages.error(request, f'Error saving inspection: {str(e)}')
        return redirect('inspection')


@login_required
def reports(request):
    if request.method == 'POST':
        form = ReportForm(request.POST)
        if form.is_valid():
            report = form.save(commit=False)
            report.generated_by = request.user
            report.save()
            # TODO: Generate PDF asynchronously
            messages.success(request, 'Report generation started.')
    else:
        form = ReportForm()
    
    reports_list = Report.objects.select_related('layout', 'generated_by').order_by('-generated_at')
    paginator = Paginator(reports_list, 10)
    page_number = request.GET.get('page')
    reports_page = paginator.get_page(page_number)
    
    context = {
        'form': form,
        'reports': reports_page,
    }
    
    if request.htmx:
        return render(request, 'components/reports_content.html', context)
    
    return render(request, 'reports.html', context)


@login_required
def users(request):
    # Check if user is admin
    try:
        profile = request.user.userprofile
        if not profile.is_admin:
            messages.error(request, 'Access denied. Admin privileges required.')
            return redirect('dashboard')
    except UserProfile.DoesNotExist:
        messages.error(request, 'User profile not found.')
        return redirect('dashboard')
    
    users_list = User.objects.select_related('userprofile').order_by('username')
    paginator = Paginator(users_list, 10)
    page_number = request.GET.get('page')
    users_page = paginator.get_page(page_number)
    
    context = {
        'users': users_page,
    }
    
    if request.htmx:
        return render(request, 'components/users_content.html', context)
    
    return render(request, 'users.html', context)


@login_required
def get_component_data(request, component_id):
    """HTMX endpoint to get component data for inspection panel"""
    component = get_object_or_404(WarehouseComponent, id=component_id)
    latest_inspection = component.inspections.first()
    
    context = {
        'component': component,
        'latest_inspection': latest_inspection,
        'defect_types': DefectType.choices,
        'severity_levels': SeverityLevel.choices,
    }
    
    return render(request, 'components/inspection_panel.html', context)


@login_required
def export_layout_csv(request, layout_id):
    """Export warehouse layout as CSV"""
    layout = get_object_or_404(WarehouseLayout, id=layout_id)
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{layout.name}_layout.csv"'
    
    import csv
    writer = csv.writer(response)
    writer.writerow(['component_id', 'type', 'x', 'y', 'width', 'height', 'status'])
    
    for component in layout.components.all():
        writer.writerow([
            component.id,
            component.component_type,
            component.x_position,
            component.y_position,
            component.width,
            component.height,
            component.status
        ])
    
    return response


@login_required
@require_http_methods(["POST"])
def import_layout_csv(request):
    """Import warehouse layout from CSV"""
    if 'csv_file' not in request.FILES:
        messages.error(request, 'No CSV file uploaded.')
        return redirect('layout_editor')
    
    csv_file = request.FILES['csv_file']
    
    try:
        import csv
        import io
        
        # Create new layout
        layout = WarehouseLayout.objects.create(
            name=f"Imported Layout {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            created_by=request.user
        )
        
        # Parse CSV
        csv_data = csv_file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_data))
        
        for row in csv_reader:
            WarehouseComponent.objects.create(
                id=row['component_id'],
                layout=layout,
                component_type=row['type'],
                x_position=float(row['x']),
                y_position=float(row['y']),
                width=float(row['width']),
                height=float(row['height']),
                status=row.get('status', ComponentStatus.GOOD)
            )
        
        messages.success(request, f'Layout imported successfully as "{layout.name}"')
        
    except Exception as e:
        messages.error(request, f'Error importing CSV: {str(e)}')
    
    return redirect('layout_editor')

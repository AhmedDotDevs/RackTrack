from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid


class WarehouseLayout(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.name


class ComponentType(models.TextChoices):
    RACK = 'rack', 'Rack'
    BEAM = 'beam', 'Beam'
    UPRIGHT = 'upright', 'Upright'


class ComponentStatus(models.TextChoices):
    GOOD = 'good', 'Good'
    MONITOR = 'monitor', 'Monitor'
    FIX_4_WEEKS = 'fix_4_weeks', 'Fix Within 4 Weeks'
    IMMEDIATE = 'immediate', 'Immediate Threat'


class WarehouseComponent(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    layout = models.ForeignKey(WarehouseLayout, on_delete=models.CASCADE, related_name='components')
    component_type = models.CharField(max_length=20, choices=ComponentType.choices)
    x_position = models.FloatField()
    y_position = models.FloatField()
    width = models.FloatField()
    height = models.FloatField()
    status = models.CharField(max_length=20, choices=ComponentStatus.choices, default=ComponentStatus.GOOD)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.id} ({self.get_component_type_display()})"

    @property
    def status_color(self):
        color_map = {
            ComponentStatus.GOOD: 'success',
            ComponentStatus.MONITOR: 'success',
            ComponentStatus.FIX_4_WEEKS: 'warning',
            ComponentStatus.IMMEDIATE: 'danger'
        }
        return color_map.get(self.status, 'primary')


class DefectType(models.TextChoices):
    BENT_UPRIGHT = 'bent_upright', 'Bent Upright'
    DAMAGED_BEAM = 'damaged_beam', 'Damaged Beam'
    LOOSE_CONNECTIONS = 'loose_connections', 'Loose Connections'
    CORROSION = 'corrosion', 'Corrosion/Rust'
    MISSING_COMPONENTS = 'missing_components', 'Missing Components'
    OVERLOADING = 'overloading', 'Overloading'
    CUSTOM = 'custom', 'Custom Defect'


class SeverityLevel(models.TextChoices):
    GREEN = 'green', 'Monitor - No immediate action required'
    AMBER = 'amber', 'Fix within 4 weeks'
    RED = 'red', 'Immediate threat - Fix now'


class Inspection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    component = models.ForeignKey(WarehouseComponent, on_delete=models.CASCADE, related_name='inspections')
    inspector = models.ForeignKey(User, on_delete=models.CASCADE)
    defect_type = models.CharField(max_length=50, choices=DefectType.choices)
    custom_defect = models.CharField(max_length=255, blank=True, help_text="Required if defect type is 'Custom'")
    severity = models.CharField(max_length=10, choices=SeverityLevel.choices)
    notes = models.TextField(blank=True)
    inspection_date = models.DateTimeField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)
    is_resolved = models.BooleanField(default=False)
    resolved_date = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_inspections')

    class Meta:
        ordering = ['-inspection_date']

    def save(self, *args, **kwargs):
        # Auto-calculate due date based on severity
        if self.severity == SeverityLevel.AMBER and not self.due_date:
            self.due_date = (self.inspection_date + timezone.timedelta(weeks=4)).date()
        
        # Update component status based on severity
        if self.severity == SeverityLevel.RED:
            self.component.status = ComponentStatus.IMMEDIATE
        elif self.severity == SeverityLevel.AMBER:
            self.component.status = ComponentStatus.FIX_4_WEEKS
        else:
            self.component.status = ComponentStatus.MONITOR
        
        self.component.save()
        super().save(*args, **kwargs)

    def __str__(self):
        defect_name = self.custom_defect if self.defect_type == DefectType.CUSTOM else self.get_defect_type_display()
        return f"{self.component.id} - {defect_name} ({self.get_severity_display()})"

    @property
    def is_overdue(self):
        if not self.due_date or self.is_resolved:
            return False
        return timezone.now().date() > self.due_date


class InspectionPhoto(models.Model):
    inspection = models.ForeignKey(Inspection, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='inspection_photos/')
    caption = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo for {self.inspection}"


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('inspector', 'Inspector'),
        ('admin', 'Administrator'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='inspector')
    phone = models.CharField(max_length=20, blank=True)
    certification_number = models.CharField(max_length=50, blank=True)
    certification_expiry = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_inspector(self):
        return self.role == 'inspector'


class Report(models.Model):
    REPORT_TYPES = [
        ('full', 'Full Inspection Report'),
        ('defects', 'Defects Summary'),
        ('urgent', 'Urgent Items Only'),
        ('compliance', 'Compliance Certificate'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    layout = models.ForeignKey(WarehouseLayout, on_delete=models.CASCADE)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE)
    generated_at = models.DateTimeField(auto_now_add=True)
    date_from = models.DateField()
    date_to = models.DateField()
    pdf_file = models.FileField(upload_to='reports/', blank=True)
    include_layout = models.BooleanField(default=True)
    include_photos = models.BooleanField(default=True)
    include_inspector_details = models.BooleanField(default=False)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.get_report_type_display()} - {self.generated_at.strftime('%Y-%m-%d %H:%M')}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('amber_reminder', 'Amber Defect Reminder'),
        ('red_alert', 'Red Defect Alert'),
        ('overdue', 'Overdue Item'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    inspection = models.ForeignKey(Inspection, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_notification_type_display()} for {self.user.username}"

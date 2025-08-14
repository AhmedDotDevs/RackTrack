from django.contrib import admin
from unfold.admin import ModelAdmin
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from .models import (
    WarehouseLayout, WarehouseComponent, Inspection, InspectionPhoto,
    UserProfile, Report, Notification
)


class WarehouseComponentResource(resources.ModelResource):
    class Meta:
        model = WarehouseComponent
        fields = ('id', 'layout__name', 'component_type', 'x_position', 'y_position', 
                 'width', 'height', 'status')
        export_order = fields


@admin.register(WarehouseLayout)
class WarehouseLayoutAdmin(ModelAdmin):
    list_display = ('name', 'created_by', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(WarehouseComponent)
class WarehouseComponentAdmin(ImportExportModelAdmin, ModelAdmin):
    resource_class = WarehouseComponentResource
    list_display = ('id', 'layout', 'component_type', 'status', 'x_position', 'y_position')
    list_filter = ('component_type', 'status', 'layout')
    search_fields = ('id', 'layout__name')
    ordering = ('layout', 'id')


class InspectionPhotoInline(admin.TabularInline):
    model = InspectionPhoto
    extra = 0


@admin.register(Inspection)
class InspectionAdmin(ModelAdmin):
    list_display = ('component', 'inspector', 'defect_type', 'severity', 'inspection_date', 
                   'is_resolved', 'is_overdue')
    list_filter = ('severity', 'defect_type', 'is_resolved', 'inspection_date')
    search_fields = ('component__id', 'inspector__username', 'notes')
    readonly_fields = ('inspection_date',)
    inlines = [InspectionPhotoInline]
    
    def is_overdue(self, obj):
        return obj.is_overdue
    is_overdue.boolean = True
    is_overdue.short_description = 'Overdue'


@admin.register(UserProfile)
class UserProfileAdmin(ModelAdmin):
    list_display = ('user', 'role', 'certification_number', 'certification_expiry')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email', 'certification_number')


@admin.register(Report)
class ReportAdmin(ModelAdmin):
    list_display = ('layout', 'report_type', 'generated_by', 'generated_at', 'date_from', 'date_to')
    list_filter = ('report_type', 'generated_at')
    search_fields = ('layout__name', 'generated_by__username')
    readonly_fields = ('generated_at',)


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = ('user', 'notification_type', 'inspection', 'is_read', 'created_at', 'sent_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'message')
    readonly_fields = ('created_at',)

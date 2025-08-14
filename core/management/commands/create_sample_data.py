from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import (
    WarehouseLayout, WarehouseComponent, Inspection, UserProfile,
    ComponentType, ComponentStatus, DefectType, SeverityLevel
)
import uuid


class Command(BaseCommand):
    help = 'Create sample data for the warehouse inspection system'

    def handle(self, *args, **options):
        # Create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@warehouse.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            UserProfile.objects.create(
                user=admin_user,
                role='admin',
                certification_number='CERT-001'
            )
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin_user.username}'))

        # Create inspector users
        inspector_users = []
        for i, (first, last, email) in enumerate([
            ('Sarah', 'Wilson', 'sarah.wilson@warehouse.com'),
            ('Mike', 'Chen', 'mike.chen@warehouse.com')
        ], 1):
            user, created = User.objects.get_or_create(
                username=f'inspector{i}',
                defaults={
                    'email': email,
                    'first_name': first,
                    'last_name': last
                }
            )
            if created:
                user.set_password('inspector123')
                user.save()
                UserProfile.objects.create(
                    user=user,
                    role='inspector',
                    certification_number=f'CERT-{i+1:03d}'
                )
                self.stdout.write(self.style.SUCCESS(f'Created inspector user: {user.username}'))
            inspector_users.append(user)

        # Create sample warehouse layout
        layout, created = WarehouseLayout.objects.get_or_create(
            name='Main Warehouse Layout',
            defaults={
                'description': 'Primary warehouse racking layout',
                'created_by': admin_user
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created layout: {layout.name}'))

        # Create sample components
        components_data = [
            ('RK-A1-B1', ComponentType.RACK, 50, 50, 120, 60, ComponentStatus.GOOD),
            ('RK-A1-B2', ComponentType.RACK, 200, 50, 120, 60, ComponentStatus.MONITOR),
            ('RK-A1-B3', ComponentType.RACK, 350, 50, 120, 60, ComponentStatus.FIX_4_WEEKS),
            ('RK-B1-B1', ComponentType.RACK, 50, 150, 120, 60, ComponentStatus.GOOD),
            ('RK-B2-U1', ComponentType.UPRIGHT, 200, 150, 120, 60, ComponentStatus.IMMEDIATE),
            ('RK-B3-B1', ComponentType.BEAM, 350, 150, 120, 60, ComponentStatus.FIX_4_WEEKS),
        ]

        for comp_id, comp_type, x, y, width, height, status in components_data:
            component, created = WarehouseComponent.objects.get_or_create(
                id=comp_id,
                defaults={
                    'layout': layout,
                    'component_type': comp_type,
                    'x_position': x,
                    'y_position': y,
                    'width': width,
                    'height': height,
                    'status': status
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created component: {comp_id}'))

        # Create sample inspections
        inspections_data = [
            ('RK-A1-B3', DefectType.BENT_UPRIGHT, '', SeverityLevel.AMBER, 'Minor bending observed on upright post'),
            ('RK-B2-U1', DefectType.LOOSE_CONNECTIONS, '', SeverityLevel.RED, 'Several bolts are loose and require immediate attention'),
            ('RK-B3-B1', DefectType.CORROSION, '', SeverityLevel.AMBER, 'Surface rust on beam connection points'),
        ]

        for comp_id, defect_type, custom_defect, severity, notes in inspections_data:
            try:
                component = WarehouseComponent.objects.get(id=comp_id)
                inspector = inspector_users[0] if inspector_users else admin_user
                
                inspection, created = Inspection.objects.get_or_create(
                    component=component,
                    defect_type=defect_type,
                    severity=severity,
                    defaults={
                        'inspector': inspector,
                        'custom_defect': custom_defect,
                        'notes': notes
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created inspection for {comp_id}'))
            except WarehouseComponent.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Component {comp_id} not found for inspection'))

        self.stdout.write(self.style.SUCCESS('Sample data creation completed successfully!'))
        self.stdout.write(self.style.SUCCESS('Admin credentials: admin / admin123'))
        self.stdout.write(self.style.SUCCESS('Inspector credentials: inspector1 / inspector123'))

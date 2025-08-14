from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('layout/', views.layout_editor, name='layout_editor'),
    path('inspection/', views.inspection, name='inspection'),
    path('reports/', views.reports, name='reports'),
    path('users/', views.users, name='users'),
    
    # HTMX endpoints
    path('api/save-layout/', views.save_layout, name='save_layout'),
    path('api/create-inspection/', views.create_inspection, name='create_inspection'),
    path('api/component/<str:component_id>/', views.get_component_data, name='get_component_data'),
    
    # CSV endpoints
    path('api/export-layout/<uuid:layout_id>/', views.export_layout_csv, name='export_layout_csv'),
    path('api/import-layout/', views.import_layout_csv, name='import_layout_csv'),
]

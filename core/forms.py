from django import forms
from django.contrib.auth.models import User
from .models import (
    Inspection, WarehouseComponent, WarehouseLayout, Report, UserProfile,
    DefectType, SeverityLevel, ComponentType, ComponentStatus
)


class InspectionForm(forms.ModelForm):
    class Meta:
        model = Inspection
        fields = ['component', 'defect_type', 'custom_defect', 'severity', 'notes']
        widgets = {
            'component': forms.Select(attrs={'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'}),
            'defect_type': forms.Select(attrs={'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'}),
            'custom_defect': forms.TextInput(attrs={'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary', 'placeholder': 'Required if defect type is Custom'}),
            'severity': forms.RadioSelect(attrs={'class': 'text-primary focus:ring-primary'}),
            'notes': forms.Textarea(attrs={'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary', 'rows': 3, 'placeholder': 'Additional inspection notes...'}),
        }


class ComponentForm(forms.ModelForm):
    class Meta:
        model = WarehouseComponent
        fields = ['id', 'component_type', 'status']
        widgets = {
            'id': forms.TextInput(attrs={'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary', 'placeholder': 'RK-A1-B1'}),
            'component_type': forms.Select(attrs={'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'}),
            'status': forms.Select(attrs={'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'}),
        }


class ReportForm(forms.ModelForm):
    class Meta:
        model = Report
        fields = ['layout', 'report_type', 'date_from', 'date_to', 'include_layout', 'include_photos', 'include_inspector_details']
        widgets = {
            'layout': forms.Select(attrs={'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'}),
            'report_type': forms.Select(attrs={'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'}),
            'date_from': forms.DateInput(attrs={'type': 'date', 'class': 'px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'}),
            'date_to': forms.DateInput(attrs={'type': 'date', 'class': 'px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'}),
            'include_layout': forms.CheckboxInput(attrs={'class': 'text-primary focus:ring-primary'}),
            'include_photos': forms.CheckboxInput(attrs={'class': 'text-primary focus:ring-primary'}),
            'include_inspector_details': forms.CheckboxInput(attrs={'class': 'text-primary focus:ring-primary'}),
        }


class UserProfileForm(forms.ModelForm):
    first_name = forms.CharField(max_length=30, required=False)
    last_name = forms.CharField(max_length=30, required=False)
    email = forms.EmailField()
    
    class Meta:
        model = UserProfile
        fields = ['role', 'phone', 'certification_number', 'certification_expiry']
        widgets = {
            'role': forms.Select(attrs={'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'}),
            'phone': forms.TextInput(attrs={'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'}),
            'certification_number': forms.TextInput(attrs={'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'}),
            'certification_expiry': forms.DateInput(attrs={'type': 'date', 'class': 'w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary'}),
        }
    
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        if user:
            self.fields['first_name'].initial = user.first_name
            self.fields['last_name'].initial = user.last_name
            self.fields['email'].initial = user.email
    
    def save(self, commit=True):
        profile = super().save(commit=False)
        
        # Update user fields
        user = profile.user
        user.first_name = self.cleaned_data['first_name']
        user.last_name = self.cleaned_data['last_name']
        user.email = self.cleaned_data['email']
        
        if commit:
            user.save()
            profile.save()
        
        return profile

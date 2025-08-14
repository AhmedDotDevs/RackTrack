// Alpine.js extensions and utilities for the Warehouse Inspection System

// Global state management
document.addEventListener('alpine:init', () => {
    Alpine.store('app', {
        sidebarOpen: window.innerWidth >= 1024,
        currentView: 'dashboard',
        selectedComponent: null,
        notifications: [],
        
        toggleSidebar() {
            this.sidebarOpen = !this.sidebarOpen;
        },
        
        setCurrentView(view) {
            this.currentView = view;
        },
        
        selectComponent(component) {
            this.selectedComponent = component;
        },
        
        addNotification(notification) {
            this.notifications.unshift({
                id: Date.now(),
                ...notification,
                timestamp: new Date()
            });
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                this.removeNotification(notification.id || Date.now());
            }, 5000);
        },
        
        removeNotification(id) {
            this.notifications = this.notifications.filter(n => n.id !== id);
        }
    });
});

// Modal management
Alpine.data('modal', () => ({
    isOpen: false,
    
    open() {
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
    },
    
    close() {
        this.isOpen = false;
        document.body.style.overflow = 'auto';
    },
    
    toggle() {
        this.isOpen ? this.close() : this.open();
    }
}));

// Form validation
Alpine.data('form', (initialData = {}) => ({
    data: { ...initialData },
    errors: {},
    isSubmitting: false,
    
    validate() {
        this.errors = {};
        let isValid = true;
        
        // Basic validation rules
        Object.keys(this.data).forEach(key => {
            const value = this.data[key];
            
            if (key.includes('email') && value && !/\S+@\S+\.\S+/.test(value)) {
                this.errors[key] = 'Please enter a valid email address';
                isValid = false;
            }
            
            if (key.includes('required') && !value) {
                this.errors[key] = 'This field is required';
                isValid = false;
            }
        });
        
        return isValid;
    },
    
    async submit(url, method = 'POST') {
        if (!this.validate()) return;
        
        this.isSubmitting = true;
        
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
                },
                body: JSON.stringify(this.data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            Alpine.store('app').addNotification({
                type: 'success',
                message: 'Operation completed successfully'
            });
            
            return result;
        } catch (error) {
            Alpine.store('app').addNotification({
                type: 'error',
                message: error.message || 'An error occurred'
            });
            throw error;
        } finally {
            this.isSubmitting = false;
        }
    }
}));

// Dropdown management
Alpine.data('dropdown', () => ({
    isOpen: false,
    
    toggle() {
        this.isOpen = !this.isOpen;
    },
    
    close() {
        this.isOpen = false;
    }
}));

// Table management
Alpine.data('table', (initialData = []) => ({
    data: initialData,
    selectedItems: [],
    sortField: '',
    sortDirection: 'asc',
    searchQuery: '',
    
    get filteredData() {
        let filtered = [...this.data];
        
        if (this.searchQuery) {
            filtered = filtered.filter(item => 
                Object.values(item).some(value => 
                    String(value).toLowerCase().includes(this.searchQuery.toLowerCase())
                )
            );
        }
        
        if (this.sortField) {
            filtered.sort((a, b) => {
                const aVal = a[this.sortField];
                const bVal = b[this.sortField];
                
                if (this.sortDirection === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        }
        
        return filtered;
    },
    
    sort(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
    },
    
    toggleSelection(item) {
        const index = this.selectedItems.findIndex(selected => selected.id === item.id);
        if (index > -1) {
            this.selectedItems.splice(index, 1);
        } else {
            this.selectedItems.push(item);
        }
    },
    
    selectAll() {
        this.selectedItems = [...this.filteredData];
    },
    
    deselectAll() {
        this.selectedItems = [];
    }
}));

// Toast notifications
Alpine.data('toastManager', () => ({
    toasts: [],
    
    add(toast) {
        const id = Date.now();
        this.toasts.push({
            id,
            type: 'info',
            duration: 5000,
            ...toast
        });
        
        setTimeout(() => this.remove(id), toast.duration || 5000);
    },
    
    remove(id) {
        this.toasts = this.toasts.filter(toast => toast.id !== id);
    }
}));

// Utility functions
window.warehouseUtils = {
    // Format dates consistently
    formatDate(date, format = 'short') {
        const d = new Date(date);
        const options = {
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        };
        return d.toLocaleDateString('en-US', options[format]);
    },
    
    // Debounce function calls
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Generate unique IDs
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Get severity color classes
    getSeverityColor(severity) {
        const colors = {
            'red': 'bg-danger text-white',
            'amber': 'bg-warning text-white',
            'green': 'bg-success text-white',
            'immediate': 'bg-danger text-white',
            'fix_4_weeks': 'bg-warning text-white',
            'monitor': 'bg-success text-white',
            'good': 'bg-success text-white'
        };
        return colors[severity] || 'bg-neutral-500 text-white';
    },
    
    // Format component type display
    formatComponentType(type) {
        const types = {
            'rack': 'Rack',
            'beam': 'Beam',
            'upright': 'Upright'
        };
        return types[type] || type;
    },
    
    // Format defect type display
    formatDefectType(type) {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
};

// HTMX integration enhancements
document.addEventListener('htmx:afterRequest', function(event) {
    // Handle HTMX responses
    if (event.detail.xhr.status >= 400) {
        Alpine.store('app').addNotification({
            type: 'error',
            message: 'An error occurred while processing your request'
        });
    }
});

document.addEventListener('htmx:beforeSend', function(event) {
    // Show loading state
    const target = event.target;
    if (target) {
        target.style.opacity = '0.6';
        target.style.pointerEvents = 'none';
    }
});

document.addEventListener('htmx:afterSettle', function(event) {
    // Hide loading state
    const target = event.target;
    if (target) {
        target.style.opacity = '1';
        target.style.pointerEvents = 'auto';
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Global shortcuts
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 's':
                event.preventDefault();
                // Trigger save action if available
                const saveBtn = document.querySelector('[data-action="save"]');
                if (saveBtn) saveBtn.click();
                break;
            case 'n':
                event.preventDefault();
                // Trigger new action if available
                const newBtn = document.querySelector('[data-action="new"]');
                if (newBtn) newBtn.click();
                break;
        }
    }
    
    // Escape key closes modals
    if (event.key === 'Escape') {
        const openModal = document.querySelector('[x-show="isOpen"]:not([style*="display: none"])');
        if (openModal) {
            // Find and trigger close action
            const closeBtn = openModal.querySelector('[data-action="close"]');
            if (closeBtn) closeBtn.click();
        }
    }
});

// Initialize responsive behavior
function handleResize() {
    if (window.innerWidth < 768) {
        Alpine.store('app').sidebarOpen = false;
    } else if (window.innerWidth >= 1024) {
        Alpine.store('app').sidebarOpen = true;
    }
}

window.addEventListener('resize', warehouseUtils.debounce(handleResize, 250));
handleResize(); // Initial check

console.log('Alpine.js extensions loaded for Warehouse Inspection System');

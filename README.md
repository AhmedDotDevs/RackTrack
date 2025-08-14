# Warehouse Pallet Racking Inspection & Certification Management System

A comprehensive Django-based system for managing warehouse pallet racking inspections with interactive layout editing, defect tracking, and automated reporting.

## Features

- **Interactive Layout Editor**: Canvas-based warehouse layout design using Konva.js
- **Inspection Workflow**: Click-to-inspect components with severity-based color coding
- **Automated Reporting**: Professional PDF generation with WeasyPrint
- **User Management**: Role-based access for Inspectors and Administrators
- **Real-time Dashboard**: Statistics and urgent items monitoring
- **Data Import/Export**: CSV support for layout backup and restoration
- **Notification System**: Automated alerts for amber/red defects

## Tech Stack

### Backend
- **Django 5.0.1**: Python web framework
- **PostgreSQL**: Primary database
- **django-vite**: Asset bundling with Vite
- **django-htmx**: Server-driven interactivity
- **django-allauth**: Authentication system
- **django-unfold**: Modern admin interface
- **WeasyPrint**: PDF report generation

### Frontend
- **HTMX**: Partial page updates without JavaScript frameworks
- **Alpine.js**: Lightweight client-side reactivity
- **Tailwind CSS v4**: Utility-first styling
- **Konva.js**: Interactive canvas for warehouse layouts
- **Font Awesome**: Local icon library

## Installation

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 12+
- UV (Python package manager)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd warehouse-inspection-system
   ```

2. **Create Python virtual environment with UV**
   ```bash
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   uv pip install -r requirements.txt
   ```

4. **Configure PostgreSQL**
   ```bash
   # Create database
   createdb warehouse_inspection
   
   # Set environment variables
   export PGDATABASE=warehouse_inspection
   export PGUSER=your_username
   export PGPASSWORD=your_password
   export PGHOST=localhost
   export PGPORT=5432
   ```

5. **Run database migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Load sample data (optional)**
   ```bash
   python manage.py create_sample_data
   ```

8. **Install Node.js dependencies**
   ```bash
   npm install
   ```

9. **Build frontend assets**
   ```bash
   npm run build
   ```

10. **Collect static files**
    ```bash
    python manage.py collectstatic --noinput
    ```

## Development

### Running the Development Server

1. **Start Django development server**
   ```bash
   python manage.py runserver 0.0.0.0:5000
   ```

2. **Start Vite development server (optional, for hot reloading)**
   ```bash
   npm run dev
   ```

### Project Structure


"""
WSGI config for warehouse_inspection project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'warehouse_inspection.settings')

application = get_wsgi_application()

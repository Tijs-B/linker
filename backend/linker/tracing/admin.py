from django.contrib.gis import admin

from .models import CheckpointLog

admin.site.register(CheckpointLog, admin.GISModelAdmin)


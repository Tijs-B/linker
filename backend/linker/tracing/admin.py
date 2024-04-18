from django.contrib.gis import admin

from .models import CheckpointLog


@admin.register(CheckpointLog)
class CheckpointLogAdmin(admin.ModelAdmin):
    list_display = (
        'fiche',
        'team',
        'arrived',
        'left',
    )
    list_display_links = ('fiche', 'team')
    ordering = ('-arrived',)
    list_filter = ('team', 'fiche')

    def has_change_permission(self, request, obj=None):
        return False

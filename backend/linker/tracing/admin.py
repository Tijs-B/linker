from django.contrib.gis import admin
from django.http.request import HttpRequest

from .models import CheckpointLog, Notification


@admin.register(CheckpointLog)
class CheckpointLogAdmin(admin.ModelAdmin[CheckpointLog]):
    list_display = (
        'fiche',
        'team',
        'arrived',
        'left',
    )
    list_display_links = ('fiche', 'team')
    ordering = ('-arrived',)
    list_filter = ('team', 'fiche')

    def has_change_permission(self, request: HttpRequest, obj: CheckpointLog | None = None) -> bool:
        return False


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin[Notification]):
    list_display = ('notification_type', 'tracker', 'severity', 'sent')
    list_filter = ('notification_type',)
    readonly_fields = ('sent',)

    def has_change_permission(self, request: HttpRequest, obj: Notification | None = None) -> bool:
        return False

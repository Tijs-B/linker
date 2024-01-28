from django.contrib.gis import admin

from linker.trackers.models import Tracker, TrackerLog


@admin.register(Tracker)
class TrackerAdmin(admin.ModelAdmin):
    readonly_fields = ('last_log',)


@admin.register(TrackerLog)
class TrackerLogAdmin(admin.GISModelAdmin):
    fieldsets = [
        (
            None,
            {
                'fields': ['tracker', 'gps_datetime', 'point']
            }
        ),
        (
            'Details',
            {
                'classes': ['collapse'],
                'fields': (
                    'satellites', 'input_acc', 'voltage', 'analog_input', 'tracker_type', 'heading', 'speed',
                    'is_online',
                    'has_gps', 'has_power', 'is_online_threshold', 'name', 'code'
                ),
            }
        ),
    ]
    readonly_fields = (
        'tracker', 'gps_datetime', 'satellites', 'input_acc', 'voltage', 'analog_input', 'tracker_type', 'heading',
        'speed', 'is_online', 'has_gps', 'has_power', 'is_online_threshold', 'name', 'code'
    )

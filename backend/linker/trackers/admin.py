from django.contrib.gis import admin
from django.urls import reverse
from django.utils.html import format_html

from linker.trackers.models import Tracker, TrackerLog


@admin.register(Tracker)
class TrackerAdmin(admin.ModelAdmin):
    readonly_fields = ('last_log',)
    list_display = ('tracker_id', 'tracker_name', 'used_by')
    ordering = (
        'tracker_name',
        'tracker_id',
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('organizationmember', 'team')

    @admin.display()
    def used_by(self, obj):
        if hasattr(obj, 'team'):
            url = reverse('admin:people_team_change', args=(obj.team.id,))
            return format_html('<a href={url}>{team}</a>', url=url, team=obj.team)
        elif hasattr(obj, 'organizationmember'):
            url = reverse('admin:people_organizationmember_change', args=(obj.organizationmember.id,))
            return format_html(
                '<a href={url}>{organization_member}</a>', url=url, organization_member=obj.organizationmember
            )


@admin.register(TrackerLog)
class TrackerLogAdmin(admin.GISModelAdmin):
    fieldsets = [
        (None, {'fields': ['tracker', 'gps_datetime', 'point']}),
        (
            'Details',
            {
                'classes': ['collapse'],
                'fields': (
                    'fetch_datetime',
                    'local_datetime',
                    'satellites',
                    'input_acc',
                    'voltage',
                    'analog_input',
                    'tracker_type',
                    'heading',
                    'speed',
                    'is_online',
                    'has_gps',
                    'has_power',
                    'is_online_threshold',
                    'name',
                    'code',
                ),
            },
        ),
    ]
    readonly_fields = (
        'tracker',
        'gps_datetime',
        'fetch_datetime',
        'local_datetime',
        'satellites',
        'input_acc',
        'voltage',
        'analog_input',
        'tracker_type',
        'heading',
        'speed',
        'is_online',
        'has_gps',
        'has_power',
        'is_online_threshold',
        'name',
        'code',
    )
    list_display = ('gps_datetime', 'tracker_url')
    ordering = ('-gps_datetime',)
    list_filter = ('tracker',)

    @admin.display(description='tracker')
    def tracker_url(self, obj):
        url = reverse('admin:trackers_tracker_change', args=(obj.tracker.id,))
        return format_html('<a href={url}>{tracker}</a>', url=url, tracker=obj.tracker)

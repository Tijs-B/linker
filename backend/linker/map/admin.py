from django.contrib.gis import admin

from .models import Weide, Fiche, Zijweg, Tocht, MapNote

admin.site.register(Weide, admin.GISModelAdmin)
admin.site.register(Fiche, admin.GISModelAdmin)
admin.site.register(Zijweg, admin.GISModelAdmin)


@admin.register(Tocht)
class TochtAdmin(admin.GISModelAdmin):
    ordering = ('order',)


@admin.register(MapNote)
class MapNoteAdmin(admin.GISModelAdmin):
    readonly_fields = ('created', 'updated')

from django.contrib.gis import admin

from .models import Weide, Fiche, Zijweg, Tocht, MapNote, Basis, ForbiddenArea

admin.site.register(Zijweg, admin.GISModelAdmin)
admin.site.register(Basis, admin.GISModelAdmin)


@admin.register(Tocht)
class TochtAdmin(admin.GISModelAdmin):
    ordering = ('order',)


@admin.register(MapNote)
class MapNoteAdmin(admin.GISModelAdmin):
    readonly_fields = ('created', 'updated', 'author')
    search_fields = ('content',)
    list_display = ('__str__', 'created', 'author')


@admin.register(ForbiddenArea)
class ForbiddenAreaAdmin(admin.GISModelAdmin):
    search_fields = ('description',)


@admin.register(Fiche)
class FicheAdmin(admin.GISModelAdmin):
    ordering = ('tocht__order', 'order')


@admin.register(Weide)
class WeideAdmin(admin.GISModelAdmin):
    ordering = ('identifier',)

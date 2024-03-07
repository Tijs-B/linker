from django.contrib import admin

from .models import ContactPerson, Team, OrganizationMember, TeamNote

admin.site.register(ContactPerson, admin.ModelAdmin)
admin.site.register(OrganizationMember, admin.ModelAdmin)


class ContactPersonInline(admin.TabularInline):
    model = ContactPerson


class TeamNoteInline(admin.TabularInline):
    model = TeamNote


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    inlines = [ContactPersonInline, TeamNoteInline]
    ordering = ('number',)

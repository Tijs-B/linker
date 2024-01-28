from django.contrib import admin

from .models import ContactPerson, Team, OrganizationMember

admin.site.register(ContactPerson, admin.ModelAdmin)
admin.site.register(OrganizationMember, admin.ModelAdmin)


class ContactPersonInline(admin.TabularInline):
    model = ContactPerson


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    inlines = [
        ContactPersonInline
    ]
    ordering = ('number',)

from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from enumfields.admin import EnumFieldListFilter

from .models import ContactPerson, Team, OrganizationMember, TeamNote


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'code')
    search_fields = ('name',)
    list_filter = (('member_type', EnumFieldListFilter),)


@admin.register(ContactPerson)
class ContactPersonAdmin(admin.ModelAdmin):
    list_display = ('name', 'team_url', 'is_favorite')
    ordering = ('team__number', '-is_favorite', 'name')
    search_fields = ('name',)
    list_filter = ('is_favorite', 'team')

    @admin.display(description='team')
    def team_url(self, obj):
        url = reverse('admin:people_team_change', args=(obj.team.id,))
        return format_html('<a href={url}>{team}</a>', url=url, team=obj.team)


class ContactPersonInline(admin.TabularInline):
    model = ContactPerson
    extra = 0


class TeamNoteInline(admin.TabularInline):
    model = TeamNote
    extra = 0


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    inlines = [ContactPersonInline, TeamNoteInline]
    ordering = ('number',)
    list_display = ('__str__', 'chiro', 'safe_weide')
    list_filter = ('safe_weide',)
    search_fields = ('name', 'number', 'chiro')
    fields = ('direction', 'number', 'name', 'chiro', 'tracker', 'group_picture', 'safe_weide', 'checkpoints')
    readonly_fields = ('checkpoints',)

    @admin.display()
    def checkpoints(self, obj: Team):
        url = f'{reverse("admin:tracing_checkpointlog_changelist")}?team={obj.pk}'
        nb_checkpoints = obj.checkpointlogs.count()
        return format_html(f'<a href={url}>{nb_checkpoints} checkpoints</a>')

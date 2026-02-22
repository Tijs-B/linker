from django.contrib import admin
from django.http import HttpRequest
from django.urls import reverse
from django.utils.html import format_html
from enumfields.admin import EnumFieldListFilter

from .models import ContactPerson, LoginToken, OrganizationMember, Team, TeamNote


@admin.register(LoginToken)
class LoginTokenAdmin(admin.ModelAdmin[LoginToken]):
    list_display = ('user', 'login_url', 'created_at')
    readonly_fields = ('token', 'login_url', 'created_at')
    fields = ('user', 'token', 'login_url', 'created_at')

    def changelist_view(self, request: HttpRequest, extra_context: dict | None = None) -> object:
        self.request = request
        return super().changelist_view(request, extra_context)

    def changeform_view(self, request: HttpRequest, *args: object, **kwargs: object) -> object:
        self.request = request
        return super().changeform_view(request, *args, **kwargs)

    def save_model(self, request: HttpRequest, obj: LoginToken, form: object, change: bool) -> None:
        if not obj.pk:
            obj.token = LoginToken.generate_token()
        super().save_model(request, obj, form, change)

    @admin.display(description='Login URL')
    def login_url(self, obj: LoginToken) -> str:
        url = self.request.build_absolute_uri(f'/login?token={obj.token}')
        return format_html('<a href="{url}">{url}</a>', url=url)


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin[OrganizationMember]):
    list_display = ('__str__', 'code')
    search_fields = ('name',)
    list_filter = (('member_type', EnumFieldListFilter),)


@admin.register(ContactPerson)
class ContactPersonAdmin(admin.ModelAdmin[ContactPerson]):
    list_display = ('name', 'team_url', 'is_favorite')
    ordering = ('team__number', '-is_favorite', 'name')
    search_fields = ('name',)
    list_filter = ('is_favorite', 'team')

    @admin.display(description='team')
    def team_url(self, obj: ContactPerson) -> str:
        url = reverse('admin:people_team_change', args=(obj.team.id,))
        return format_html('<a href={url}>{team}</a>', url=url, team=obj.team)


class ContactPersonInline(admin.TabularInline[ContactPerson, Team]):
    model = ContactPerson
    extra = 0


class TeamNoteInline(admin.TabularInline[TeamNote, Team]):
    model = TeamNote
    extra = 0


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin[Team]):
    inlines = [ContactPersonInline, TeamNoteInline]
    ordering = ('number',)
    list_display = ('__str__', 'chiro', 'safe_weide')
    list_filter = ('safe_weide',)
    search_fields = ('name', 'number', 'chiro')
    fields = (
        'direction',
        'number',
        'name',
        'chiro',
        'tracker',
        'safe_weide',
        'safe_weide_updated_at',
        'checkpoints',
    )
    readonly_fields = ('checkpoints', 'safe_weide_updated_at')

    @admin.display()
    def checkpoints(self, obj: Team) -> str:
        url = f'{reverse("admin:tracing_checkpointlog_changelist")}?team={obj.pk}'
        nb_checkpoints = obj.checkpointlogs.count()
        return format_html(f'<a href={url}>{nb_checkpoints} checkpoints</a>')

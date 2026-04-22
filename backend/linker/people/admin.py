from django.contrib import admin
from django.http import HttpRequest, HttpResponse
from django.urls import path, reverse
from django.utils.html import format_html
from enumfields.admin import EnumFieldListFilter

from .models import ContactPerson, LoginToken, OrganizationMember, Team, TeamNote, TeamSafetyLog
from .utils import generate_vcf


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

    def get_urls(self) -> list:
        return [
            path(
                'download-vcf/', self.admin_site.admin_view(self.download_vcf), name='people_contactperson_download_vcf'
            )
        ] + super().get_urls()

    def download_vcf(self, request: HttpRequest) -> HttpResponse:
        return HttpResponse(
            generate_vcf(),
            content_type='text/vcard',
            headers={'Content-Disposition': 'attachment; filename="contacts.vcf"'},
        )

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


class TeamSafetyLogInline(admin.StackedInline):
    model = TeamSafetyLog
    extra = 0


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin[Team]):
    inlines = [ContactPersonInline, TeamNoteInline, TeamSafetyLogInline]
    ordering = ('number',)
    list_display = ('__str__', 'chiro', 'last_safety_location')
    search_fields = ('name', 'number', 'chiro')
    fields = (
        'direction',
        'number',
        'name',
        'chiro',
        'tracker',
        'last_safety_location',
        'checkpoints',
    )
    readonly_fields = ('checkpoints', 'last_safety_location')

    @admin.display()
    def checkpoints(self, obj: Team) -> str:
        url = f'{reverse("admin:tracing_checkpointlog_changelist")}?team={obj.pk}'
        nb_checkpoints = obj.checkpointlogs.count()
        return format_html('<a href="{}">{} checkpoints</a>', url, nb_checkpoints)

    @admin.display()
    def last_safety_location(self, obj: Team) -> str:
        latest_log = obj.team_safety_logs.order_by('-created').first()
        if latest_log:
            return latest_log.location or '-'
        return '-'

from django.contrib import admin

from .models import Setting, Switch


@admin.register(Switch)
class SwitchAdmin(admin.ModelAdmin[Switch]):
    list_display = ('name', 'active', 'description')


@admin.register(Setting)
class SettingAdmin(admin.ModelAdmin[Setting]):
    list_display = ('key', 'value', 'description')

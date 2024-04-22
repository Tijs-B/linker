from django.contrib import admin

from .models import Setting, Switch


@admin.register(Switch)
class SwitchAdmin(admin.ModelAdmin):
    list_display = ('name', 'active')


@admin.register(Setting)
class SettingAdmin(admin.ModelAdmin):
    list_display_ = ('key', 'value', 'description')

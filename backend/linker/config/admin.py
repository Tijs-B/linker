from django.contrib import admin

from .models import Setting, Switch

admin.site.register(Setting, admin.ModelAdmin)
admin.site.register(Switch, admin.ModelAdmin)

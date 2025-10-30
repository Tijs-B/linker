from logging import getLogger

from django.http.request import HttpRequest
from django.views.generic.base import View
from rest_framework import permissions

logger = getLogger(__name__)


class CanViewStats(permissions.BasePermission):
    def has_permission(self, request: HttpRequest, view: View) -> bool:
        if not request.user:
            return False
        return request.user.has_perm('people.view_stats')

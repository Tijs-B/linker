from logging import getLogger

from rest_framework import permissions

logger = getLogger(__name__)


class CanViewStats(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user:
            return False
        return request.user.has_perm('people.view_stats')

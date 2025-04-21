from logging import getLogger

from rest_framework import permissions

logger = getLogger(__name__)


class CanUploadPicture(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user:
            return False
        return request.user.has_perm('people.can_upload_picture')

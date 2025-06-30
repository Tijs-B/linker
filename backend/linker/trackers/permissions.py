from rest_framework import permissions


class CanViewHeatmap(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user:
            return False
        return request.user.has_perm('trackers.view_heatmap')


class CanViewTrackerLogs(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user:
            return False
        return request.user.has_perm('trackers.view_trackerlog')

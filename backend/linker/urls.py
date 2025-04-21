from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt
from rest_framework import routers

from linker.map.views import (
    BasisViewSet,
    FicheViewSet,
    ForbiddenAreaViewSet,
    MapNoteViewSet,
    TochtViewSet,
    WeideViewSet,
    ZijwegViewSet,
)
from linker.people.views import (
    ContactPersonViewSet,
    LoginView,
    LogoutView,
    OrganizationMemberViewSet,
    TeamNoteViewSet,
    TeamViewSet,
    UserView,
)
from linker.tracing.views import CheckpointLogViewSet, NotificationViewSet, StatsView
from linker.trackers.views import HeatmapView, TrackerLogViewSet, TrackerViewSet

router = routers.DefaultRouter()
router.register('teams', TeamViewSet, basename='team')
router.register('organization-members', OrganizationMemberViewSet)
router.register('team-notes', TeamNoteViewSet)
router.register('contact-persons', ContactPersonViewSet)

router.register('tochten', TochtViewSet)
router.register('fiches', FicheViewSet)
router.register('weides', WeideViewSet)
router.register('zijwegen', ZijwegViewSet)
router.register('map-notes', MapNoteViewSet)
router.register('basis', BasisViewSet)
router.register('forbidden-areas', ForbiddenAreaViewSet)

router.register('checkpoint-logs', CheckpointLogViewSet)
router.register('notifications', NotificationViewSet, basename='notification')

router.register('trackers', TrackerViewSet, basename='tracker')
router.register('tracker-logs', TrackerLogViewSet)


urlpatterns = [
    path('api/', include(router.urls)),
    path('api/stats/', StatsView.as_view()),
    path('api/heatmap/', HeatmapView.as_view()),
    path('api/login/', csrf_exempt(LoginView.as_view())),
    path('api/logout/', LogoutView.as_view()),
    path('api/user/', UserView.as_view()),
    path('admin/', admin.site.urls),
]

if settings.DEBUG:
    urlpatterns.append(path('__debug__/', include('debug_toolbar.urls')))
    urlpatterns.extend(static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT))

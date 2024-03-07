"""
URL configuration for linker project.

The `urlpatterns` list routes URLs to  For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers

from linker.map.views import (
    TochtViewSet,
    FicheViewSet,
    WeideViewSet,
    ZijwegViewSet,
    MapNoteViewSet,
    BasisViewSet,
    ForbiddenAreaViewSet,
)
from linker.people.views import TeamViewSet, OrganizationMemberViewSet, TeamNoteViewSet, ContactPersonViewSet, LoginView
from linker.tracing.views import CheckpointLogViewSet, all_stats
from linker.trackers.views import TrackerViewSet

router = routers.DefaultRouter()
router.register('teams', TeamViewSet)
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

router.register('trackers', TrackerViewSet)


urlpatterns = [
    path('api/', include(router.urls)),
    path('api/stats/', all_stats),
    path('api/login/', LoginView.as_view()),
    path('admin/', admin.site.urls),
]

if settings.DEBUG:
    urlpatterns.append(path('__debug__/', include('debug_toolbar.urls')))

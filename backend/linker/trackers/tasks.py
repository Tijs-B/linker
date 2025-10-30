from logging import getLogger

from celery import shared_task
from django.conf import settings
from redis import Redis
from redis.lock import Lock

from linker.config.models import Switch

from .constants import SWITCH_FETCH_TRACKERS_API, SWITCH_FETCH_TRACKERS_MINISITE
from .geodynamics import fetch_geodynamics_api_data, fetch_geodynamics_minisite_data

logger = getLogger(__name__)


@shared_task
def download_tracker_data_minisite() -> None:
    if Switch.switch_is_active(SWITCH_FETCH_TRACKERS_MINISITE):
        with Lock(
            redis=Redis.from_url(settings.CELERY_BROKER_URL), name='download-tracker-data', blocking=False, timeout=30
        ):
            fetch_geodynamics_minisite_data()


@shared_task
def download_tracker_data_api() -> None:
    if Switch.switch_is_active(SWITCH_FETCH_TRACKERS_API):
        fetch_geodynamics_api_data()

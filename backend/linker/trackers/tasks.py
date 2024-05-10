from logging import getLogger
from pathlib import Path

from celery import shared_task
from django.conf import settings
from redis import Redis
from redis.lock import Lock

from .constants import SWITCH_FETCH_TRACKERS_MINISITE, SWITCH_FETCH_TRACKERS_API
from .geodynamics import fetch_geodynamics_minisite_data, fetch_geodynamics_api_data
from .heatmap import generate_heatmap_tiles
from ..config.models import Switch


logger = getLogger(__name__)


@shared_task
def download_tracker_data_minisite():
    if Switch.switch_is_active(SWITCH_FETCH_TRACKERS_MINISITE):
        with Lock(
            redis=Redis.from_url(settings.CELERY_BROKER_URL), name='download-tracker-data', blocking=False, timeout=30
        ):
            fetch_geodynamics_minisite_data()


@shared_task
def download_tracker_data_api():
    if Switch.switch_is_active(SWITCH_FETCH_TRACKERS_API):
        fetch_geodynamics_api_data()


@shared_task
def update_heatmap():
    logger.info('Updating heatmap')
    generate_heatmap_tiles(Path(settings.HEATMAP_PATH))

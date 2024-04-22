from logging import getLogger
from pathlib import Path

from celery import shared_task
from django.conf import settings
from redis import Redis
from redis.lock import Lock

from .constants import SWITCH_FETCH_TRACKERS
from .geodynamics import fetch_geodynamics_data
from .utils import generate_heatmap_tiles
from ..config.models import Switch


logger = getLogger(__name__)


@shared_task
def download_tracker_data():
    if Switch.switch_is_active(SWITCH_FETCH_TRACKERS):
        with Lock(
            redis=Redis.from_url(settings.CELERY_BROKER_URL), name='download-tracker-data', blocking=False, timeout=30
        ):
            fetch_geodynamics_data()


@shared_task
def update_heatmap():
    logger.info('Updating heatmap')
    generate_heatmap_tiles(Path(settings.HEATMAP_PATH))

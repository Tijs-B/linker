from pathlib import Path

from celery import shared_task
from django.conf import settings
from redis import Redis
from redis.lock import Lock

from .constants import SWITCH_SIMULATE
from .simulation import simulate_download_tracker_data
from .utils import generate_heatmap_tiles
from ..config.models import Switch


@shared_task
def download_tracker_data():
    if Switch.switch_is_active(SWITCH_SIMULATE):
        with Lock(
            redis=Redis.from_url(settings.CELERY_BROKER_URL), name='download-tracker-data', blocking=False, timeout=30
        ):
            simulate_download_tracker_data()


@shared_task
def update_heatmap():
    generate_heatmap_tiles(Path(settings.HEATMAP_PATH))

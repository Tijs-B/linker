from celery import shared_task

from .constants import SWITCH_SIMULATE
from .simulation import simulate_download_tracker_data
from ..config.models import Switch


@shared_task
def download_tracker_data():
    if Switch.switch_is_active(SWITCH_SIMULATE):
        simulate_download_tracker_data()


@shared_task
def update_heatmap():
    pass

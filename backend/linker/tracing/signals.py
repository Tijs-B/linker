from django.contrib.gis.measure import D
from django.db.models import Q
from django.db.models.signals import post_save
from django.dispatch import receiver

from .constants import FICHE_MAX_DISTANCE
from .models import CheckpointLog
from ..map.models import Fiche
from ..trackers.models import TrackerLog


@receiver(post_save, sender=TrackerLog)
def log_checkpoints(instance, **kwargs):
    if not hasattr(instance.tracker, 'team'):
        return

    timestamp = instance.gps_datetime

    fiche = Fiche.objects.filter(point__distance_lte=(instance.point, D(m=FICHE_MAX_DISTANCE))).first()
    team_checkpoints = CheckpointLog.objects.filter(team=instance.tracker.team)

    # Leave all checkpoints that are not the current checkpoint, and are not left yet (of left later than now).
    team_checkpoints.filter(~Q(fiche=fiche), Q(left=None) | Q(left__Gte=timestamp)).update(left=timestamp)

    # If the team is not at a fiche
    if fiche is None:
        return

    # If the team is currently at the same fiche which he has not yet left, don't update it
    if team_checkpoints(fiche=fiche, left=None).exists():
        return

    CheckpointLog.objects.create(timestamp=timestamp, fiche=fiche, team=instance.tracker.team)

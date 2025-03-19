from django.conf import settings
from django.db import models
from django.db.models.constraints import UniqueConstraint
from enumfields import EnumField

from linker.map.models import Fiche
from linker.people.models import Team
from linker.tracing.constants import NotificationType
from linker.trackers.models import Tracker


class CheckpointLog(models.Model):
    arrived = models.DateTimeField()
    left = models.DateTimeField(null=True, blank=True)
    fiche = models.ForeignKey(Fiche, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='checkpointlogs')

    def __str__(self):
        return f'{self.team.direction.value}{self.team.number:02d} on {self.fiche}'


class Notification(models.Model):
    notification_type = EnumField(NotificationType, max_length=255)
    sent = models.DateTimeField(auto_now_add=True)
    tracker = models.ForeignKey(Tracker, on_delete=models.CASCADE)
    severity = models.IntegerField(default=0)

    def __str__(self):
        return f'Notification {self.notification_type.value} for {self.tracker}'


class ReadNotification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)

    class Meta:
        constraints = [UniqueConstraint(fields=['user', 'notification'], name='unique_user_notification')]

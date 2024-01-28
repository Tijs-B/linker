from django.db import models

from linker.map.models import Fiche
from linker.people.models import Team


class CheckpointLog(models.Model):
    arrived = models.DateTimeField()
    left = models.DateTimeField()
    fiche = models.ForeignKey(Fiche, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='checkpointlogs')

    def __str__(self):
        return f"{self.team.direction.value}{self.team.number:02d} on {self.fiche}"



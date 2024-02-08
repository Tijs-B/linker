from celery import shared_task

from linker.people.models import Team
from linker.tracing.utils import trace_team


@shared_task
def trace_teams():
    for team in Team.objects.all():
        trace_team(team)

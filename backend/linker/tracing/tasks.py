from logging import getLogger

from celery import shared_task

from linker.people.models import Team
from linker.tracing.utils import trace_team


logger = getLogger(__name__)


@shared_task
def trace_teams():
    logger.info('Starting tracing teams')
    for team in Team.objects.all():
        trace_team(team)

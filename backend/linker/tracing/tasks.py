from logging import getLogger

from celery import shared_task

from linker.config.models import Switch
from linker.people.models import Team
from linker.tracing.constants import SWITCH_TRACE_TEAMS
from linker.tracing.utils import trace_team


logger = getLogger(__name__)


@shared_task
def trace_teams():
    if Switch.switch_is_active(SWITCH_TRACE_TEAMS):
        logger.info('Starting tracing teams')
        for team in Team.objects.all():
            trace_team(team)

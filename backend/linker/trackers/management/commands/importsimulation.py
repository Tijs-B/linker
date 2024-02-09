from django.core.management import BaseCommand

from linker.trackers.simulation import import_all


class Command(BaseCommand):
    def handle(self, *args, **options):
        import_all()

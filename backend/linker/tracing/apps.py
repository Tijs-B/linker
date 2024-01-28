from django.apps import AppConfig


class TracingConfig(AppConfig):
    name = 'linker.tracing'

    def ready(self):
        from . import signals

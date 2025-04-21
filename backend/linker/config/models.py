from logging import getLogger

from django.db import models

logger = getLogger(__name__)


class Setting(models.Model):
    key = models.CharField(max_length=50, primary_key=True, unique=True)
    value = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return f'{self.key}: {self.value}'

    @classmethod
    def get_value_for_key(cls, key: str, default: str | None = None) -> str:
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            if default is not None:
                return default
            raise KeyError(f'No setting found for {key}')


class Switch(models.Model):
    name = models.CharField(max_length=50, db_index=True, unique=True)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f'{self.name}'

    @classmethod
    def switch_is_active(cls, name: str) -> bool:
        try:
            return cls.objects.get(name=name).active
        except cls.DoesNotExist:
            logger.warning(f'Switch {name} does not exist')
            return False

from django.contrib.auth.models import User
from django.contrib.gis.db import models
from django.contrib.gis.db.models import Collect
from django.contrib.gis.db.models.functions import Centroid
from django.contrib.gis.geos import Point
from django.core.validators import MinValueValidator


class Tocht(models.Model):
    identifier = models.CharField(max_length=2, unique=True)
    order = models.IntegerField(validators=[MinValueValidator(1)], null=True, blank=True)
    is_alternative = models.BooleanField(default=False)
    leads = models.ManyToManyField('people.OrganizationMember', blank=True)

    route = models.LineStringField()

    def __str__(self):
        return self.identifier

    @classmethod
    def centroid(cls) -> Point:
        return cls.objects.filter(is_alternative=False).aggregate(centroid=Centroid(Collect('route')))['centroid']


class Weide(models.Model):
    identifier = models.CharField(max_length=1, unique=True)
    name = models.CharField(max_length=20)
    tocht = models.OneToOneField(Tocht, null=True, blank=True, on_delete=models.SET_NULL)
    polygon = models.PolygonField()

    def __str__(self):
        return f'Weide {self.identifier}'


class Basis(models.Model):
    point = models.PointField()


class Fiche(models.Model):
    order = models.IntegerField(validators=[MinValueValidator(1)])
    tocht = models.ForeignKey('Tocht', on_delete=models.CASCADE)
    point = models.PointField()

    class Meta:
        unique_together = [['order', 'tocht']]

    def __str__(self):
        return self.tocht.identifier + str(self.order)


class Zijweg(models.Model):
    geom = models.LineStringField()


class MapNote(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    content = models.TextField()
    point = models.PointField()
    author = models.ForeignKey(User, blank=True, null=True, on_delete=models.SET_NULL)

    def __str__(self):
        if len(self.content) > 30:
            return f'{self.content[:30]}...'
        return self.content


class ForbiddenArea(models.Model):
    description = models.TextField(blank=True)
    area = models.MultiPolygonField()

    def __str__(self):
        if not self.description:
            return super().__str__()
        if len(self.description) > 30:
            return f'{self.description[:30]}...'
        return self.description

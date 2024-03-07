from django.contrib.gis.db import models
from django.contrib.gis.geos import MultiLineString
from django.core.validators import MinValueValidator


class Tocht(models.Model):
    identifier = models.CharField(max_length=1, unique=True)
    order = models.IntegerField(validators=[MinValueValidator(1)])
    leads = models.ManyToManyField('people.OrganizationMember')

    route = models.LineStringField()

    def __str__(self):
        return self.identifier

    def natural_key(self):
        return self.identifier

    @classmethod
    def centroid(cls):
        routes = list(tocht.route for tocht in cls.objects.all())
        multi_linestring = MultiLineString(*routes)
        return multi_linestring.centroid


class Weide(models.Model):
    tocht = models.OneToOneField('Tocht', on_delete=models.CASCADE)
    polygon = models.PolygonField()

    def __str__(self):
        return self.tocht.identifier


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


class ForbiddenArea(models.Model):
    description = models.TextField(blank=True)
    area = models.MultiPolygonField()

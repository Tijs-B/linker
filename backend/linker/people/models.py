from django.contrib.auth.models import User
from django.db import models
from enumfields import EnumField

from linker.people.constants import Direction, MemberType
from linker.trackers.models import Tracker, TrackerLog


class ContactPerson(models.Model):
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=13, blank=True, null=True)
    email_address = models.CharField(max_length=100, blank=True, null=True)
    is_favorite = models.BooleanField(default=False)

    team = models.ForeignKey('Team', on_delete=models.CASCADE, related_name='contact_persons')

    def __str__(self):
        return f'{self.team.direction.value}{self.team.number:02d} {self.name}'


class OrganizationMember(models.Model):
    tracker = models.OneToOneField(Tracker, on_delete=models.SET_NULL, blank=True, null=True)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=5, help_text='De letters die op de kaart verschijnen')
    phone_number = models.CharField(max_length=13, blank=True)
    member_type = EnumField(MemberType, max_length=13)

    def __str__(self):
        return f'{self.member_type.value.title()} - {self.name}'

    @property
    def last_log(self) -> TrackerLog | None:
        if self.tracker:
            return self.tracker.last_log
        else:
            return None


def group_picture_path(instance, filename):
    return f'G{instance.number:02d}_{filename}'


class Team(models.Model):
    direction = EnumField(Direction)
    number = models.PositiveIntegerField(unique=True)
    name = models.CharField(max_length=100)
    chiro = models.CharField(max_length=100)
    tracker = models.OneToOneField(Tracker, on_delete=models.SET_NULL, blank=True, null=True)
    group_picture = models.ImageField(upload_to=group_picture_path, blank=True, null=True)

    safe_weide = models.CharField(max_length=64, blank=True)
    safe_weide_updated_at = models.DateTimeField(blank=True, null=True)
    safe_weide_updated_by = models.ForeignKey(User, blank=True, null=True, on_delete=models.SET_NULL)

    class Meta:
        permissions = [('can_upload_picture', 'Can upload a group picture')]

    def __str__(self):
        return f'{self.direction.value}{self.number:02d} {self.name}'

    @property
    def last_log(self) -> TrackerLog | None:
        if self.tracker:
            return self.tracker.last_log
        else:
            return None


class TeamNote(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='team_notes')
    created = models.DateTimeField(auto_now_add=True)
    text = models.TextField()
    author = models.ForeignKey(User, blank=True, null=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f'{self.team}: {self.text}'

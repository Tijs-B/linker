from linker.people.models import ContactPerson


def generate_vcf() -> str:
    cards = []
    persons = (
        ContactPerson.objects.filter(phone_number__isnull=False)
        .exclude(phone_number='')
        .exclude(name='')
        .select_related('team')
        .order_by('team__number')
    )
    for person in persons:
        team_number_prefix = f'G{person.team.number:02d}'
        if person.is_favorite:
            team_number_prefix += '*'
        name = f'{team_number_prefix} {person.name}'
        cards.append(
            f'BEGIN:VCARD\nVERSION:3.0\nFN:{name}\nN:{name};;;;\nTEL;TYPE=CELL:{person.phone_number}\nEND:VCARD'
        )
    return '\n'.join(cards)

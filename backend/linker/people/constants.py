from enum import Enum


class Direction(Enum):
    RED = 'R'
    BLUE = 'B'

    def __str__(self) -> str:
        if self == Direction.RED:
            return 'Rood'
        return 'Blauw'


class MemberType(Enum):
    AGENDA = 'Agenda'
    COORDINATIE = 'Coordinatie'
    RODE_KRUIS = 'Rode Kruis'
    HANDIGE_HARRY = 'Handige Harry'
    WEIDE = 'Weide'

    def __str__(self) -> str:
        return self.value

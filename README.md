# Linker

Linker is een tracingsysteem om de deelnemers van [Chirolink](https://chirolink.be) op te kunnen volgen tijdens het wandelweekend.

## Snelstart

De gemakkelijkste manier om linker lokaal te draaien is m.b.v. Docker. Je hebt hiervoor git, Docker en Docker Compose nodig.

#### 1. Clone deze repository

```bash
git clone https://github.com/Tijs-B/linker.git
```

#### 2. Stap in de directory

```bash
cd linker
```

#### 3. Build

```bash
docker compose build
```

#### 4. Creëer de database en de superuser

```bash
docker compose run --rm linker python manage.py migrate
docker compose run --rm linker python manage.py createsuperuser
```

#### 5. Start de containers

Je moet de frontend container nog un-commenten als je hem in een docker container wilt draaien in `docker-compose.yml`

```bash
docker compose up -d
```

#### 6. Check dat alles werkt

De frontend draait nu op [localhost:8061](http://localhost:8060) en de backend op [localhost:8060/admin](http://localhost:8060/admin).

## Roadmap

- [x] Doorlooptijden
  - [x] Per tocht en richting
  - [ ] Voor een bepaald stuk, mbv markers/sections
  - [x] Per groep
    - [x] Op team pagina per tocht zetten
- [x] Verboden zones
  - [x] Basis implementatie
  - [x] Melding wanneer groep in verboden zone loopt
- [x] Leesbare locatie per team
- [x] Safe status per team (veilig op een weide)
  - [x] Filter lijst van teams op teams die nog niet safe zijn
  - [ ] Timestamp safe
  - [ ] Formulier voor weidebewoner om in te vullen
  - [ ] Veilig op bus?
- [x] Notities per team
- [x] Kaartnotities
  - [x] Toevoegen via frontend
  - [x] Opmerking bekijken via frontend
  - [x] Verwijderen
- [x] Groepsfoto's
  - [x] Backend
  - [x] Retrieve / update in frontend
- [x] Frontend polling & offline data management
  - [x] Auto refetch tracker data. Werkt dat nu zelfs?
  - [x] Melding bij offline
  - [x] Lokale cache van data (telefoonnummers bijvoorbeeld!) bij offline
- [ ] Flag aandacht vragende teams?
- [x] Meldingen?
  - [x] Tracker health: wanneer een tracker uit staat of al even geen updates meer heeft gekregen
  - [x] Wanneer een groep echt heel ver van de route zit
  - [x] Wanneer een groep al een hele tijd stil staat
- [x] Heatmap

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

```bash
docker compose up -d
```

#### 6. Check dat alles werkt

De frontend draait nu op [localhost:8061](http://localhost:8060) en de backend op [localhost:8060/admin](http://localhost:8060/admin).

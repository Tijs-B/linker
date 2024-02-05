################
### FRONTEND ###
################
FROM node:21.6-bullseye AS frontend

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json .
RUN npm ci

COPY frontend .

########################
### FRONTEND BUILDER ###
########################
FROM frontend AS frontend_builder

RUN npm run build

###############
### BACKEND ###
###############
FROM python:3.11.4-bullseye AS backend

WORKDIR /app
RUN apt-get update && apt-get install --no-install-recommends -y \
    # for geodjango
    binutils \
    libproj-dev \
    gdal-bin

ENV PYTHONBUFFERED 1 \
    PYTHONDONTWRITEBYTECODE 1 \
    DJANGO_SETTINGS_MODULE linker.settings


COPY backend/requirements.lock .

RUN pip install -r requirements.lock

COPY --chmod=0755 backend/docker-entrypoint.sh ./docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]

###########
### DEV ###
###########
FROM backend AS dev

COPY backend/requirements-dev.lock .

RUN pip install -r requirements-dev.lock

COPY backend .

##################
### PRODUCTION ###
##################
FROM backend AS production

COPY backend .
COPY --from=frontend_builder /app/dist/ ./static

RUN python manage.py collectstatic --noinput

CMD gunicorn linker.wsgi --bind 0.0.0.0:8000 --chdir=/app

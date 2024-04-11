################
### FRONTEND ###
################
FROM node:21.6-bullseye AS frontend

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json .
RUN npm ci

COPY frontend .

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

COPY backend .

RUN python manage.py collectstatic --noinput

#############
### NGINX ###
#############
FROM nginx AS custom-nginx

RUN rm /etc/nginx/conf.d/default.conf
COPY deployment/nginx.conf /etc/nginx/conf.d

COPY --from=frontend /app/dist /app/serve
COPY --from=backend /app/static /app/serve/static

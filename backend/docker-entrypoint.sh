#!/usr/bin/env bash

python << END
import os
import psycopg
import sys
import time

connection_url = os.environ['DATABASE_URL'].replace('postgis://', 'postgresql://')
connection_dict = psycopg.conninfo.conninfo_to_dict(connection_url)

suggest_unrecoverable_after = 30
start = time.time()

while True:
    try:
        psycopg.connect(**connection_dict)
        break
    except psycopg.OperationalError as error:
        sys.stderr.write('Waiting for Postgresql to become available...\n')

        if time.time() - start > suggest_unrecoverable_after:
            sys.stderr.write('  This is taking longer than expected. The following exception may be indicative of an unrecoverable error: "{}"\n'.format(error))

    time.sleep(1)
END

>&2 echo 'Postgresql is available'

exec "$@"

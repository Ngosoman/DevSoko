#!/bin/bash
set -e

cd /opt/render/project/src/Backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
python DevBackend/manage.py migrate --noinput

# Start gunicorn with the correct settings
gunicorn DevBackend.wsgi:application --bind 0.0.0.0:10000 --workers 2

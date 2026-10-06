"""Gunicorn production config for the GHOSTER API.

Usage: gunicorn -c gunicorn_conf.py app.main:app
"""
import multiprocessing
import os

bind = os.environ.get('GUNICORN_BIND', '127.0.0.1:8000')
worker_class = 'uvicorn.workers.UvicornWorker'
workers = int(os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
timeout = int(os.environ.get('GUNICORN_TIMEOUT', 60))
graceful_timeout = 30
keepalive = 5
accesslog = '-'
errorlog = '-'
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')

"""Smoke-test the built deployment with synthetic configuration and no database access."""

import http.client
import os
import re
import secrets
import socket
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PYTHON = ROOT / "backend/.venv/bin/python"
environment = {
    **os.environ,
    "DJANGO_SETTINGS_MODULE": "config.production",
    "DJANGO_SECRET_KEY": secrets.token_urlsafe(64),
    "DJANGO_ALLOWED_HOSTS": "diary.example.test",
    "DATABASE_URL": f"postgresql://diary:{secrets.token_urlsafe(24)}@localhost:9/unused",
}
subprocess.run(
    [
        str(PYTHON),
        "backend/manage.py",
        "collectstatic",
        "--noinput",
        "--verbosity",
        "0",
    ],
    cwd=ROOT,
    env=environment,
    check=True,
)
with socket.socket() as listener:
    listener.bind(("127.0.0.1", 0))
    port = listener.getsockname()[1]
server = subprocess.Popen(
    [
        str(PYTHON),
        "-m",
        "gunicorn",
        "config.wsgi:application",
        "--bind",
        f"127.0.0.1:{port}",
        "--workers",
        "1",
    ],
    cwd=ROOT / "backend",
    env=environment,
)


def request(path, *, forwarded=True, host="diary.example.test"):
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
    headers = {"Host": host}
    if forwarded:
        headers["X-Forwarded-Proto"] = "https"
    try:
        connection.request("GET", path, headers=headers)
        response = connection.getresponse()
        return response.status, dict(response.getheaders()), response.read().decode()
    finally:
        connection.close()


try:
    deadline = time.monotonic() + 10
    while True:
        try:
            status, headers, html = request("/")
            break
        except (ConnectionError, OSError):
            if server.poll() is not None or time.monotonic() >= deadline:
                raise RuntimeError("Production server did not start.") from None
            time.sleep(0.05)
    assert status == 200, status
    assert 'id="root"' in html
    assets = re.findall(r'(?:src|href)="(/static/app/assets/[^"]+)"', html)
    assert len(assets) >= 2, "Built JavaScript and CSS must be referenced."
    for asset in assets:
        assert request(asset)[0] == 200, asset
    status, headers, html = request("/admin/login/")
    assert status == 200, status
    admin_css = re.search(r'href="(/static/admin/css/base[^"]+)"', html)
    assert admin_css and request(admin_css[1])[0] == 200
    assert request("/api/session/")[0] == 200
    assert request("/api/health/", forwarded=False)[0] == 503
    assert request("/", forwarded=False)[0] == 301
    assert request("/", host="attacker.example.test")[0] == 400
    assert request("/api/not-a-route/")[0] == 404
    print(
        "Production smoke checks passed: app, assets, admin, session, HTTPS and host protection."
    )
finally:
    server.terminate()
    server.wait(timeout=10)

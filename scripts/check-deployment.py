"""Smoke-test the built deployment with synthetic configuration and no database access."""

import http.client
import os
import re
import secrets
import socket
import subprocess
import time
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PYTHON = ROOT / "backend/.venv/bin/python"


def base_environment(settings_module: str) -> dict[str, str]:
    return {
        **os.environ,
        "DJANGO_SETTINGS_MODULE": settings_module,
        "DJANGO_SECRET_KEY": secrets.token_urlsafe(64),
        "DJANGO_ALLOWED_HOSTS": "diary.example.test",
        "DATABASE_URL": f"postgresql://diary:{secrets.token_urlsafe(24)}@localhost:9/unused",
    }


def request_at(
    port: int,
    path: str,
    *,
    forwarded: bool = True,
    host: str = "diary.example.test",
):
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


def assert_admin_static_works(port: int, *, host: str = "diary.example.test") -> None:
    status, _headers, html = request_at(port, "/admin/login/", host=host)
    assert status == 200, status
    admin_css = re.search(r'href="(/static/admin/css/base[^"]+)"', html)
    assert admin_css and request_at(port, admin_css[1], host=host)[0] == 200


@contextmanager
def with_gunicorn(environment: dict[str, str]):
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
    try:
        deadline = time.monotonic() + 10
        while True:
            try:
                request_at(port, "/api/session/")
                break
            except (ConnectionError, OSError, http.client.HTTPException):
                if server.poll() is not None or time.monotonic() >= deadline:
                    raise RuntimeError("Production server did not start.") from None
                time.sleep(0.05)
        yield port
    finally:
        server.terminate()
        server.wait(timeout=10)


def smoke_production_monolith() -> None:
    with with_gunicorn(base_environment("config.production")) as port:
        status, _headers, html = request_at(port, "/")
        assert status == 200, status
        assert 'id="root"' in html
        assets = re.findall(r'(?:src|href)="(/static/app/assets/[^"]+)"', html)
        assert len(assets) >= 2, "Built JavaScript and CSS must be referenced."
        for asset in assets:
            assert request_at(port, asset)[0] == 200, asset
        assert_admin_static_works(port)
        assert request_at(port, "/api/session/")[0] == 200
        assert request_at(port, "/api/health/", forwarded=False)[0] == 503
        assert request_at(port, "/", forwarded=False)[0] == 301
        assert request_at(port, "/", host="attacker.example.test")[0] == 400
        assert request_at(port, "/api/not-a-route/")[0] == 404
    print(
        "Production smoke checks passed: app, assets, admin, session, HTTPS and host protection."
    )


def smoke_vercel_api() -> None:
    with with_gunicorn(base_environment("config.vercel")) as port:
        assert_admin_static_works(port)
        assert request_at(port, "/api/session/")[0] == 200
    print("Vercel API smoke checks passed: admin assets and session.")


smoke_production_monolith()
smoke_vercel_api()

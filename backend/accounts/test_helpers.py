import secrets


def generated_password():
    return f"Aa1!{secrets.token_urlsafe(24)}"

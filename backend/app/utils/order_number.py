import secrets
import string

_ALPHABET = string.ascii_uppercase + string.digits


def generate_order_number() -> str:
    """GH-XXXXXXXX with 8 random base36 characters. Caller retries on a rare unique-constraint collision."""
    suffix = ''.join(secrets.choice(_ALPHABET) for _ in range(8))
    return f'GH-{suffix}'

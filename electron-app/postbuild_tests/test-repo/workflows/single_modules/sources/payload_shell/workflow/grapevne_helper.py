import sys
import logging

try:
    from grapevne.helpers import *  # noqa: F403
except ImportError:
    import ensurepip
    import subprocess

    ensurepip.bootstrap()
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "--upgrade", "grapevne"]
    )
    try:
        from grapevne.helpers import *  # noqa: F403 F401
    except ImportError:
        logging.error("Failed to install grapevne. Exiting.")
        sys.exit(1)

# Tidy-up namespace
del sys, logging

# Dynamically export all names imported from grapevne
__all__ = [name for name in dir() if not name.startswith("_")]

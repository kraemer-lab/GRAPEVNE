import logging
import sys

try:
    import grapevne
except ImportError:
    import ensurepip
    import subprocess

    ensurepip.bootstrap()
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "--upgrade", "grapevne"]
    )
    try:
        import grapevne
    except ImportError:
        logging.error("Failed to install grapevne. Exiting.")
        sys.exit(1)


def import_grapevne(workflow=None, version=None):
    _grapevne = grapevne.install(version)
    if workflow:
        _grapevne.helpers.init(workflow)
    return _grapevne.helpers

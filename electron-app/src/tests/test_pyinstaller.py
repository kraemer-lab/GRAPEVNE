import json
import subprocess

from utils import locate_pyrunner_binary
from utils import redirect_workflow_path


pyrunner = locate_pyrunner_binary()


def test_pyinstaller():
    with open("src/tests/query.json", "r") as f:
        response_js = json.load(f)
    response_js["data"] = redirect_workflow_path(response_js["data"])
    cmd_str = json.dumps(response_js)
    result = subprocess.run([pyrunner, cmd_str])
    assert result.returncode == 0

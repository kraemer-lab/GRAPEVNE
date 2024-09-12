import json
import subprocess

pyrunner = "/Users/jsb/repos/jsbrittain/GRAPEVNE/electron-app/dist/pyrunner/pyrunner"


def test_pyinstaller():
    with open("src/tests/query.json", "r") as f:
        response_js = json.load(f)
    cmd_str = json.dumps(response_js)
    result = subprocess.run([pyrunner, cmd_str])
    assert result.returncode == 0

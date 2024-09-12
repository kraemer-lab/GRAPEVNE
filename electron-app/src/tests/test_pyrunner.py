from pyrunner.pyrunner import BuildAndRun
from pyrunner.pyrunner import post
import tempfile
import json
import io
from contextlib import redirect_stdout, redirect_stderr


def test_BuildAndRun():
    with open("src/tests/query.json", "r") as f:
        response_js = json.load(f)
    data = response_js["data"]
    with tempfile.TemporaryDirectory() as temp_dir:
        response = BuildAndRun(
            data,
            build_path=temp_dir,
            clean_build=True,
            create_zip=False,
            containerize=False,
            create_launch_script=False,
        )
    assert "command" in response
    assert "workdir" in response
    command = response["command"]
    workdir = response["workdir"]
    assert workdir is not None
    assert command == (
        f"snakemake --snakefile {workdir}/workflow/Snakefile " "--cores 1 hello_target"
    )


def test_post_build_and_run():
    with open("src/tests/query.json", "r") as f:
        response_js = json.load(f)
    # 'post' requests return via stdout
    captured_output = io.StringIO()
    captured_error = io.StringIO()
    with redirect_stdout(captured_output), redirect_stderr(captured_error):
        post(json.dumps(response_js))
    stdout = captured_output.getvalue()
    stderr = captured_error.getvalue()
    assert stdout is not None
    assert stderr == ""
    response = json.loads(stdout)
    data = response.get("body")
    assert data is not None
    assert "command" in data
    assert "workdir" in data
    command = data["command"]
    workdir = data["workdir"]
    assert workdir is not None
    assert command == (
        f"snakemake --snakefile {workdir}/workflow/Snakefile " "--cores 1 hello_target"
    )

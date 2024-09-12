import os


def redirect_workflow_path(data):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    snakefile = data["content"][0]["config"]["snakefile"]
    data["content"][0]["config"]["snakefile"] = f"{script_dir}/{snakefile}"
    return data


def locate_pyrunner_binary():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    return f"{script_dir}/../../dist/pyrunner/pyrunner"

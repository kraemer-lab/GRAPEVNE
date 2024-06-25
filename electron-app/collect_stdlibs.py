import sys

reject_list = ["antigravity"]

modules = set(sys.stdlib_module_names) - set(reject_list)

print(" ".join([f"--collect-all {m}" for m in modules]))

import pkgutil


def list_packages():
    # Iterate through all available modules and packages
    packages = [mod_info.name for mod_info in pkgutil.iter_modules() if mod_info.ispkg]
    return sorted(packages)


print(" ".join([f"--collect-all {m}" for m in list_packages()]))

import yaml


# define a custom representer for strings
def quoted_presenter(dumper, data):
    return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='"')


yaml.add_representer(str, quoted_presenter)


def quoted_yaml_dump(data, **kwargs):
    # set default_flow_style=False to make sure the output is in block style
    kwargs['default_flow_style'] = kwargs.get('default_flow_style', False)
    return yaml.dump(data, **kwargs)

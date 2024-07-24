from builder.quoted_yaml import quoted_yaml_dump


def test_quoted_yaml():
    data = {
        'Reference genome size': 1,
        'key1': 'value1',
        'key2': {
            'nested_key1': 'nested_value1',
            'nested_key2': None
        },
        'key3': None,
        'key4': 123,
        'key5': True,
        'key6': False
    }
    expected = '''\
"Reference genome size": 1
"key1": "value1"
"key2":
  "nested_key1": "nested_value1"
  "nested_key2": null
"key3": null
"key4": 123
"key5": true
"key6": false
'''

    print(quoted_yaml_dump(data))
    assert quoted_yaml_dump(data) == expected

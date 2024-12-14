import { ParseDocstring, BackwardsCompatibility } from './web';

// ParseDocstring

test('ParseDocstring', () => {
  const workflow_str = `"""This is a docstring
Line 2
Line 3
"""`;
  const expected_docstring = 'This is a docstring\nLine 2\nLine 3';
  const docstring = ParseDocstring(workflow_str);
  expect(docstring).toStrictEqual(expected_docstring);
});

test('ParseDocstring_empty', () => {
  const workflow_str = ``;
  const expected_docstring = '';
  const docstring = ParseDocstring(workflow_str);
  expect(docstring).toStrictEqual(expected_docstring);
});

test('ParseDocstring_no_docstring', () => {
  const workflow_str = `This is not a docstring
Line 2
Line 3`;
  const expected_docstring = '';
  const docstring = ParseDocstring(workflow_str);
  expect(docstring).toStrictEqual(expected_docstring);
});

test('ParseDocstring_no_docstring', () => {
  const workflow_str = `not a valid docstring
"""This docstring is not at the top of the file
Line 2
Line 3`;
  const expected_docstring = '';
  const docstring = ParseDocstring(workflow_str);
  expect(docstring).toStrictEqual(expected_docstring);
});

test('BackwardsCompatibility_single_input', () => {
  const config = {
    input_namespace: 'in',
    output_namespace: 'out',
    params:
    {
      param1: 'value1',
      param2: 'value2',
    },
  };
  const new_config = BackwardsCompatibility(config);
  const expected_config = {
    ports: [
      {
        ref: 'in',
        label: 'In',
        namespace: 'in',
      },
    ],
    namespace: 'out',
    params:
    {
      param1: 'value1',
      param2: 'value2',
    },
  };
  expect(new_config).toStrictEqual(expected_config);
});

test('BackwardsCompatibility_multiple_input', () => {
  const config = {
    input_namespace: {
      'port1': 'in1',
      'port2': 'in2',
    },
    output_namespace: 'out',
    params:
    {
      param1: 'value1',
      param2: 'value2',
    },
  };
  const new_config = BackwardsCompatibility(config);
  const expected_config = {
    ports: [
      {
        ref: 'port1',
        label: 'port1',
        namespace: 'in1',
      },
      {
        ref: 'port2',
        label: 'port2',
        namespace: 'in2',
      },
    ],
    namespace: 'out',
    params:
    {
      param1: 'value1',
      param2: 'value2',
    },
  };
  expect(new_config).toStrictEqual(expected_config);
});

test('BackwardsCompatibility_passthrough', () => {
  const config = {
    input_namespace: {
      'target_module$target_port': 'target_ns',
    },
    output_namespace: 'out',
    params:
    {
      param1: 'value1',
      param2: 'value2',
    },
  };
  const new_config = BackwardsCompatibility(config);
  const expected_config = {
    ports: [
      {
        ref: 'target_module$target_port',
        label: 'target_module$target_port',
        namespace: 'target_ns',
        mapping: [
          {
            module: 'target_module',
            port: 'target_port',
          },
        ],
      },
    ],
    namespace: 'out',
    params:
    {
      param1: 'value1',
      param2: 'value2',
    },
  };
  expect(new_config).toStrictEqual(expected_config);
});

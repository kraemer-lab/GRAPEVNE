import { ParseDocstring } from "./web";

// ParseDocstring

test("ParseDocstring", () => {
  const workflow_str = `"""This is a docstring
Line 2
Line 3
"""`;
  const expected_docstring = "This is a docstring\nLine 2\nLine 3";
  const docstring = ParseDocstring(workflow_str);
  expect(docstring).toStrictEqual(expected_docstring);
});

test("ParseDocstring_empty", () => {
  const workflow_str = ``;
  const expected_docstring = "";
  const docstring = ParseDocstring(workflow_str);
  expect(docstring).toStrictEqual(expected_docstring);
});

test("ParseDocstring_no_docstring", () => {
  const workflow_str = `This is not a docstring
Line 2
Line 3`;
  const expected_docstring = "";
  const docstring = ParseDocstring(workflow_str);
  expect(docstring).toStrictEqual(expected_docstring);
});

test("ParseDocstring_no_docstring", () => {
  const workflow_str = `not a valid docstring
"""This docstring is not at the top of the file
Line 2
Line 3`;
  const expected_docstring = "";
  const docstring = ParseDocstring(workflow_str);
  expect(docstring).toStrictEqual(expected_docstring);
});

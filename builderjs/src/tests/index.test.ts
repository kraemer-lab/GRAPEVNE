import Web from "./../web";

test("test", async () => {
  const resp = await Web.GetModulesList({
    type: "local",
    repo: "src/tests/test_repo",
  });
  // Remove URLs as these are intransient to the computer
  resp.forEach((module: any) => {
    expect(module.config.url).toContain(
      "workflows/TestOrg/modules/module1/workflow/Snakefile"
    );
    module.config.url = null;
  });
  const expected = [
    {
      config: {
        params: undefined,
        url: null,
      },
      name: "(TestOrg) module1",
      type: "module",
    },
  ];
  // Check response
  expect(resp).toStrictEqual(expected);
});

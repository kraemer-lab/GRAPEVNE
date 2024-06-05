# Components

- `electron-app`: application builder for GRAPEVNE encapsulating:
  - `nodemapper`: graphical front-end for the GRAPEVNE Builder/Runner services
  - `builder`: Python library of build-related routines
  - `runner`: Python library of run-related routines (launches `snakemake`)

## Building the application

Clone the repository then, from the [root of the GRAPEVNE repository](../), run
`./build.sh`. This will configure and build the GRAPEVNE application. The final
build will be available in `./electron-app/out`.

## Packaging

See the [electron-app](../electron-app) folder for information on packaging and
generating releases.

## Contributing code

Before contributing code you should make sure there is an Issue raised
corresponding to your change. If this is a feature request then it is best to
discuss the issue in github Discussions first, to ensure that it remains
in-scope for the core project.

Code contributions work through github pull requests. If you are unfamiliar with
pull requests please read the [github documentation](https://docs.github.com/en),
and specifically
[Creating a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request).

Pull requests made to the GRAPEVNE repository undergo a series of tests to
verify that the code works as expected. This includes unit-tests for the
different components mentioned above, as-well as end-to-end testing on the
final packages, which are built for each supported operating system.

After making code changes, ensure the pre-commit checks pass:

- Install [`pre-commit`](https://pre-commit.com/)
- From inside the GRAPEVNE repository, run `pre-commit run --all-files`

End-to-end tests are not included in the pre-commit hooks but should be checked
before submitting a Pull Request. From the `./electron-app` folder run
`./run_postbuild_tests.sh`. Note that:

1. This will only run end-to-end tests on
   your operating system, but this should be a good indication before submitting a
   pull request where end-to-end tests will be run across multiple operating
   systems.
1. If building on Windows, it is expected that you execute scripts through
   GitBash (see [https://gitforwindows.org/](https://gitforwindows.org/)).
1. The script `run_postbuild_tests.sh` is designed to execute on github runners,
   so you may need to specify your OS when launching, e.g.
   `RUNNER_OS="Windows" ./run_postbuild_tests.sh`. Valid runners are `Windows`,
   `Linux` and `macOS`.

Once your pull request has been made, check back to keep on eye on the test
outcomes which should complete within the hour.
You can continue to push commits to the same branch without closing
and reopening your pull-request if additional changes are needed. Once all tests
have passed you should request code review from one of the maintainers who will
provide feedback. Once all issues are resolved your pull-request will be merged
into the main branch of the codebase.

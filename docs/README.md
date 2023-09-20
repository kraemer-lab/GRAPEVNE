The GRAPEVNE documentation is built using [sphinx](https://www.sphinx-doc.org).

All documentation is written in markdown (md) format. See `index.md` and other
files for examples of syntax and how to include diagrams, tables-of-contents,
etc.

Many editors support markdown previewing so that you can see the format of your
documentation as you type. When you are ready to generate a local build of the
documentation you will require `sphinx` along with several other dependencies.
The recommended procedure to install and run these dependencies is:
```shell
# from the GRAPEVNE repository root (NOT the docs folder)
python3 -m venv venv && source venv/bin/activate
python -m pip install -r docs/requirements.txt
cd docs && make html
```

This will generate a the documentation in a subfolder of `docs`, which you can
access by pointing your prefered web browser towards
`docs/_build/html/index.html`.

Once you are satisfied with the changes made, submit a pull-request and they
will be reviewed by a maintainer of the GRAPEVNE repository.
Once merged, any changes made to the
documentation in this folder will be automatically compiled
and uploaded to the
[GRAPEVNE documentation pages](https://grapevne.readthedocs.io/en/latest/#)
on [ReadTheDocs](https://about.readthedocs.com/)

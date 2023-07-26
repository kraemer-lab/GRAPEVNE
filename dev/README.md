## Components

- `electron-app`: application builder for GRAPEVNE encapsulating:
  - `nodemapper`: graphical front-end for the GRAPEVNE Builder/Runner services
  - `builder`: Python library of build-related routines
  - `runner`: Python library of run-related routines (launches `snakemake`)
- `backend`: Backend server if running the front-end in network mode

## Packaging

See the `electron-app` README for information on packaging and releases.

### Setup development environment

`./start-dev.sh`

This launches a [`tmuxinator`](https://github.com/tmuxinator/tmuxinator) session with front- and back-end services running in separate `tmux` windows, along with windows for development that default to the root of their respective source folders (opened in `vim`).

# Use an official Node base image
FROM node:20.14

# Enable Corepack
RUN corepack enable
RUN yarn set version stable

# Install python, curl and some editors
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    neovim \
    nano

# Install canvas@npm dependencies
RUN apt-get install -y \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev

# Install runtime dependencies
RUN apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm-dev \
    libasound2 \
    libgtk-3-0 \
    x11-apps

# Set the working directory
WORKDIR /GRAPEVNE

# Expose the port your app runs on
EXPOSE 3000
# Nodemapper runs on 5001 when in development mode
EXPOSE 5001

# Add non-root user manually (only way this works with VSCode)
ENV GID=1001
ENV UID=1001
ENV GROUPNAME=user
ENV USERNAME=user
RUN groupadd --gid $GID $GROUPNAME && \
    useradd --uid $UID --gid $GID -m $USERNAME

# Set Path (for poetry)
ENV HOME="/home/$USERNAME"
ENV PATH="$HOME/.local/bin:$PATH"

# Install poetry as user
RUN curl -sSL https://install.python-poetry.org | python3 -

# Start in bash shell
SHELL ["/bin/bash", "-c"]

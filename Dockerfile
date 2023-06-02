FROM ubuntu:latest

RUN apt-get -y update && \
    apt-get -y upgrade && \
    apt-get -y update && \
    apt-get install -y software-properties-common
RUN DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get install -y python3-pip python3-dev python3-venv

COPY . /app
WORKDIR /app/backend

# venv retains compatibility with non-docker instance
RUN rm -rf /app/backend/venv
RUN python3 -m venv venv
RUN . venv/bin/activate

RUN python3 -m pip install -r requirements.txt
#CMD ["bash", "run.sh"]

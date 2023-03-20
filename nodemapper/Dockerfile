FROM node:latest
WORKDIR /app
COPY ./ /app/
RUN yarn

# Stop build warnings - copy source files from projectstorm packages/ folder to relevant node_modules folder.
# There must be a better way to resolve, but this works for now.
RUN git clone https://github.com/projectstorm/react-diagrams.git
RUN cp -r react-diagrams/packages/* node_modules/@projectstorm/

RUN yarn
CMD ["yarn", "start" ]

# Purpose: content of the 'build' directory will be copied from this image to image:
# https://quay.io/repository/fedoraci/ciboard-server

FROM registry.access.redhat.com/ubi8/nodejs-14
COPY src $HOME/src/
COPY public $HOME/public/
COPY package.json package-lock.json .eslintrc tsconfig.json $HOME/
ARG NPMLOCATION="open"
COPY .npmrcs/$NPMLOCATION .npmrc
RUN ["bash","-c", "--", "npm install"]
RUN ["bash","-c", "--", "npm run build"]

# To build locally run:
#
# buildah bud --build-arg 'NPMLOCATION=work' --no-cache=true -t ciboard:local .
#
# To check image:
#
# podman run -ti  --user 0:0  --rm --entrypoint sh localhost/ciboard:local


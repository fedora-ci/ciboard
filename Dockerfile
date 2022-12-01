FROM quay.io/fedoraci/ciboard-server:latest
ARG NPMLOCATION="open"
# HOME == "/opt/app-root/src
ENV BUILDDIR="$HOME/ciboard-build"
# Keep order of mkdir -p and WORKDIR
RUN ["bash","-c", "--", "mkdir -p \"$BUILDDIR\""]
WORKDIR $BUILDDIR
COPY "src" "./src/"
COPY "public" "./public/"
# Taken from https://github.com/sclorg/s2i-nodejs-container/blob/master/18/Dockerfile.c8s#L73
COPY --chown=1001:0 "package.json" "package-lock.json" "tsconfig.json" "."
RUN echo "Use location: $NPMLOCATION"
COPY ".npmrcs/$NPMLOCATION" ".npmrc"
RUN ["bash","-c", "--", "npm install"]
RUN ["bash","-c", "--", "npm run build"]
RUN ["bash","-c", "--", "cp -a \"$BUILDDIR/build\" \"$HOME/frontend/\""]
WORKDIR $HOME

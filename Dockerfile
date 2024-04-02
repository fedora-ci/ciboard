FROM quay.io/fedoraci/ciboard-server:e92636a

# npm mirror to use to install dependencies.
ARG NPMLOCATION=open
# HOME == "/opt/app-root/src
ENV BUILDDIR="$HOME/ciboard-build"

RUN mkdir --parents $BUILDDIR/

COPY --chown=1001:0 package.json package-lock.json tsconfig.json $BUILDDIR/
COPY src/ $BUILDDIR/src/
COPY public/ $BUILDDIR/public/
COPY .npmrcs/$NPMLOCATION .npmrc

WORKDIR $BUILDDIR
RUN echo "Using npm location: $NPMLOCATION" && \
    npm install && \
    npm run build && \
    cp --archive $BUILDDIR/build/ $HOME/frontend/ && \
    rm -fr node_modules

WORKDIR $HOME

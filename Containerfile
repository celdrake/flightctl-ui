FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:latest as ui-build
USER root
RUN microdnf install -y rsync

WORKDIR /app
COPY package.json /app
COPY package-lock.json /app
COPY tsconfig.json /app
COPY libs /app/libs
COPY apps /app/apps
ENV NODE_OPTIONS='--max-old-space-size=8192'
RUN npm ci --verbose
RUN npm run build

FROM registry.access.redhat.com/ubi9/go-toolset:1.23.9-1751538372 as proxy-build
USER 0
# Install git to clone the flightctl repository
RUN dnf install -y git && dnf clean all
WORKDIR /app
COPY proxy /app
# Clone the flightctl repository from the fork with EDM-2347 branch
RUN git clone --depth 1 --branch EDM-2347 https://github.com/asafbennatan/flightctl.git /tmp/flightctl
RUN CGO_ENABLED=1 CGO_CFLAGS=-flto GOEXPERIMENT=strictfipsruntime go build

FROM quay.io/flightctl/flightctl-base:9.6-1758714456
COPY --from=ui-build /app/apps/standalone/dist /app/proxy/dist
COPY --from=proxy-build /app/flightctl-ui /app/proxy
WORKDIR /app/proxy
LABEL \
  com.redhat.component="flightctl-ui-container" \
  description="Flight Control User Interface Service" \
  io.k8s.description="Flight Control User Interface Service" \
  io.k8s.display-name="Flight Control UI" \
  name="flightctl-ui" \
  summary="Flight Control User Interface Service"
EXPOSE 8080
CMD ./flightctl-ui

FROM registry.access.redhat.com/ubi9/nodejs-18-minimal:latest as ui-build
USER root
RUN microdnf install -y rsync

FROM registry.access.redhat.com/ubi9/go-toolset:1.20 as proxy-build
WORKDIR /app
COPY proxy /app
USER 0
RUN go build

FROM registry.access.redhat.com/ubi9/ubi-micro
COPY --from=proxy-build /app/flightctl-ui /app/proxy
WORKDIR /app/proxy
EXPOSE 8080
CMD ./flightctl-ui

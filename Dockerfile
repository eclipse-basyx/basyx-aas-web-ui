### Dockerfile for BaSyx WebUI
## Swagger
FROM swaggerapi/swagger-ui
COPY ./EXECUTABLE/swagger/din18222.yaml /usr/share/nginx/html/openapi.yaml
ENV SWAGGER_JSON /openapi.yaml

## BaSyx WebUI
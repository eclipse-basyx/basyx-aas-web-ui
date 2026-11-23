FROM python:3.14.10-slim
ARG HTTP_PROXY
ARG HTTPS_PROXY
RUN pip install paho-mqtt

COPY publisher.py /publisher.py

CMD ["python", "/publisher.py"]
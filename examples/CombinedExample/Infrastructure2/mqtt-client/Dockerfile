FROM python:3.15.2-slim
ARG HTTP_PROXY
ARG HTTPS_PROXY
RUN pip install paho-mqtt

COPY publisher.py /publisher.py

CMD ["python", "/publisher.py"]
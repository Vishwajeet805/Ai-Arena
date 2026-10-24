# Dedicated runner image. This container processes fixed fixture identifiers only;
# it does not execute submitted code, invoke a shell, or call external targets.
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN groupadd --gid 10002 runner && useradd --uid 10002 --gid runner --create-home runner
WORKDIR /runner
COPY runner.py /runner/runner.py
USER 10002:10002
ENTRYPOINT ["python", "-I"]
CMD ["/runner/runner.py"]

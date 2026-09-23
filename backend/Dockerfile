FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
# Baked-in Whisper + Kokoro weights (see config.py's models_dir) so a fresh
# container never has to reach HuggingFace/GitHub at runtime.
COPY models ./models
COPY alembic.ini .
COPY alembic ./alembic

EXPOSE 8000

# Deliberately NOT running `alembic upgrade head` here. AppSail appears to
# enforce a startup timeout on binding $PORT; running migrations first (which
# means a cold Python start + a round trip to Neon, itself sometimes cold
# after scale-to-zero, before the port ever opens) blew past it and caused a
# crash-restart loop. Run `alembic upgrade head` manually against the target
# DATABASE_URL before deploying a new image instead.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

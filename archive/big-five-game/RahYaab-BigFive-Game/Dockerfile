# Dashboard + API only (the Pygame window needs a display, so run the game on the host with `python run.py game`).
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV RAHYAAB_DB=/app/data/rahyaab.db SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy
EXPOSE 5000
CMD ["python", "-c", "from backend.app import create_app; create_app().run(host='0.0.0.0', port=5000)"]

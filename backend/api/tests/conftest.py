"""Test settings: the app module builds its app at import time, so set the environment first."""

import os

os.environ.setdefault("APP_ENV", "test")

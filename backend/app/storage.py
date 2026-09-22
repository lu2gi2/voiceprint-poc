import shutil
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import BinaryIO

from .config import get_settings


class LocalAudioStore:
    """Raw answer audio on local disk.

    Deliberately narrow — put(), path(), delete(), purge_older_than() — so the
    S3/GCS version the PRD's deployment section implies is a drop-in swap
    rather than a refactor. Nothing outside this class knows where bytes live.
    """

    def __init__(self, root: Path | None = None) -> None:
        self.root = Path(root or get_settings().storage_dir)
        self.root.mkdir(parents=True, exist_ok=True)

    def put(self, fileobj: BinaryIO, suffix: str = ".webm") -> str:
        """Store a stream and return the key to get it back by."""
        key = f"{datetime.now(timezone.utc):%Y/%m/%d}/{uuid.uuid4().hex}{suffix}"
        dest = self.root / key
        dest.parent.mkdir(parents=True, exist_ok=True)
        with dest.open("wb") as out:
            shutil.copyfileobj(fileobj, out)
        return key

    def path(self, key: str) -> Path:
        return self.root / key

    def delete(self, key: str) -> None:
        self.path(key).unlink(missing_ok=True)

    def purge_older_than(self, days: int) -> int:
        """Delete audio past the retention window (PRD §16). Returns the count.
        Nothing calls this on a schedule yet — it is the hook a cron job or a
        startup task uses once retention actually matters."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        removed = 0
        for f in self.root.rglob("*"):
            if f.is_file() and datetime.fromtimestamp(f.stat().st_mtime, timezone.utc) < cutoff:
                f.unlink(missing_ok=True)
                removed += 1
        return removed


audio_store = LocalAudioStore()

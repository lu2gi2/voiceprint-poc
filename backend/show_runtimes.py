"""Run this live for a demo: proves the actual inference engines underneath
faster-whisper (ctranslate2) and kokoro-onnx (onnxruntime), not just that the
Python packages are installed.

    .venv/bin/python show_runtimes.py
"""

import ctranslate2
import onnxruntime

from app.pipeline.transcribe import _get_model
from app.tts.synthesize import _get_kokoro

print("=" * 60)
print("ENGINE VERSIONS")
print("=" * 60)
print("ctranslate2:", ctranslate2.__version__)
print("onnxruntime:", onnxruntime.__version__)
print("onnxruntime available providers:", onnxruntime.get_available_providers())

print()
print("=" * 60)
print("STT — faster-whisper, backed by ctranslate2")
print("=" * 60)
whisper = _get_model()
print("underlying object:", whisper.model)
print("device:", whisper.model.device)
print("compute type:", whisper.model.compute_type)

print()
print("=" * 60)
print("TTS — kokoro-onnx, backed by onnxruntime")
print("=" * 60)
kokoro = _get_kokoro()
print("underlying session:", kokoro.sess)
print("active provider:", kokoro.sess.get_providers())
print("model inputs:", [i.name for i in kokoro.sess.get_inputs()])

print()
print("Both models loaded from local weight files on disk, no network call.")
print("Only DeepSeek (question generation) touches the network - watch the")
print("server log for the one https://api.deepseek.com line when uploading")
print("a resume; everything above has no URL in it at all.")

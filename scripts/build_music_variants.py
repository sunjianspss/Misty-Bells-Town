#!/usr/bin/env python3

from __future__ import annotations

import math
import sys
import wave
from array import array
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "assets" / "audio"
INT16_MAX = 32767
INT16_MIN = -32768


def read_wave(path: Path) -> tuple[int, list[float]]:
    with wave.open(str(path), "rb") as wav_file:
        channels = wav_file.getnchannels()
        sample_width = wav_file.getsampwidth()
        sample_rate = wav_file.getframerate()
        if channels != 1 or sample_width != 2:
            raise ValueError(f"{path.name} must be mono 16-bit PCM.")
        raw = array("h")
        raw.frombytes(wav_file.readframes(wav_file.getnframes()))
        if sys.byteorder != "little":
            raw.byteswap()
    return sample_rate, [float(sample) for sample in raw]


def write_wave(path: Path, sample_rate: int, samples: list[float]) -> None:
    pcm = array("h", (clamp_sample(sample) for sample in samples))
    if sys.byteorder != "little":
        pcm.byteswap()
    with wave.open(str(path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm.tobytes())


def clamp_sample(value: float) -> int:
    return max(INT16_MIN, min(INT16_MAX, int(round(value))))


def scale(samples: list[float], gain: float) -> list[float]:
    return [sample * gain for sample in samples]


def blend(primary: list[float], secondary: list[float], primary_gain: float, secondary_gain: float) -> list[float]:
    if len(primary) != len(secondary):
        raise ValueError("Cannot blend buffers with different lengths.")
    return [
        left * primary_gain + right * secondary_gain
        for left, right in zip(primary, secondary)
    ]


def shift_loop(samples: list[float], offset: int) -> list[float]:
    loop_length = len(samples)
    if loop_length == 0:
        return []
    normalized = offset % loop_length
    return samples[normalized:] + samples[:normalized]


def circular_lowpass(samples: list[float], sample_rate: int, cutoff_hz: float, passes: int = 1) -> list[float]:
    if not samples:
        return []

    rc = 1.0 / (2.0 * math.pi * cutoff_hz)
    dt = 1.0 / sample_rate
    alpha = dt / (rc + dt)
    filtered = list(samples)

    for _ in range(max(1, passes)):
        loop = filtered * 3
        output = []
        last = loop[0]
        for sample in loop:
            last += alpha * (sample - last)
            output.append(last)
        filtered = output[-len(samples) :]

    return filtered


def limit_peak(samples: list[float], peak: int = 28000) -> list[float]:
    current_peak = max((abs(sample) for sample in samples), default=1.0)
    if current_peak <= peak:
        return samples
    gain = peak / current_peak
    return scale(samples, gain)


def build_variants() -> None:
    village_rate, village = read_wave(AUDIO_DIR / "music-village-loop.wav")
    festival_rate, festival = read_wave(AUDIO_DIR / "music-festival-loop.wav")

    if village_rate != festival_rate:
        raise ValueError("Village and festival themes must share a sample rate.")

    village_soft = circular_lowpass(village, village_rate, 2400, passes=2)
    village_deep_soft = circular_lowpass(village, village_rate, 1500, passes=3)
    village_night = circular_lowpass(village, village_rate, 1050, passes=3)
    shifted_village = shift_loop(village, len(village) // 4)

    festival_soft = circular_lowpass(festival, festival_rate, 2250, passes=2)

    variants = {
        "music-village-morning-loop.wav": limit_peak(scale(blend(village, village_soft, 0.38, 0.62), 0.82)),
        "music-village-day-a-loop.wav": limit_peak(scale(village, 0.96)),
        "music-village-day-b-loop.wav": limit_peak(
            scale(blend(shifted_village, circular_lowpass(shifted_village, village_rate, 2800, passes=1), 0.88, 0.12), 0.93)
        ),
        "music-village-evening-loop.wav": limit_peak(scale(blend(village, village_soft, 0.18, 0.82), 0.72)),
        "music-village-night-soft-loop.wav": limit_peak(scale(blend(village, village_night, 0.08, 0.92), 0.55)),
        "music-rain-soft-loop.wav": limit_peak(scale(blend(village, village_deep_soft, 0.12, 0.88), 0.5)),
        "music-festival-prep-loop.wav": limit_peak(scale(blend(festival, festival_soft, 0.32, 0.68), 0.78)),
        "music-festival-main-loop.wav": limit_peak(scale(festival, 0.98)),
    }

    for filename, samples in variants.items():
        output_path = AUDIO_DIR / filename
        write_wave(output_path, village_rate, samples)
        print(f"generated {output_path.relative_to(ROOT)}")


if __name__ == "__main__":
    build_variants()

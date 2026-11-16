# -*- coding: utf-8 -*-
"""Terminal report shared by every sector game (ASCII only: Windows consoles may not be UTF-8)."""

STREAM_LABELS = {
    "pre_med": "Pre-Medical (FSc)",
    "pre_eng": "Pre-Engineering (FSc)",
    "ics": "Computer Science (ICS)",
    "commerce": "Commerce (I.Com)",
    "arts": "Humanities (FA)",
}


def print_profile_and_streams(profile: dict, probabilities: dict, measured_features) -> None:
    print("\nCandidate profile (13 canonical keys, * = measured by this game):")
    for feature, value in profile.items():
        mark = "*" if feature in measured_features else " "
        print(f"  {mark} {feature:<28} {value:.3f}")

    print("\nFBISE academic stream probabilities:")
    for stream, p in sorted(probabilities.items(), key=lambda kv: kv[1], reverse=True):
        print(f"  {STREAM_LABELS[stream]:<24} {p * 100:6.2f}%  {'#' * round(p * 40)}")

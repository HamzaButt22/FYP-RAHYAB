# ADR-0002: Build the game as native screens in one Expo app

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-29 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | SRS ADR-01 |

## Context

The game must run smoothly on 4 GB Android phones (Tecno, Infinix, Redmi A-series) with a download of 35 MB or less (NFR-11), offline, in Urdu and English. The story, the six task families and the results all live in one app.

## Decision

The game is built as **React Native screens in a single Expo (SDK 58) app**:
- the story runs on **inkjs** (ADR-0009);
- tasks are drawn with **React Native Skia** and animated with **Reanimated** worklets and **Gesture Handler**;
- Hudhud's animations use **Rive**.

There is no WebView game engine and no Unity.

## Consequences

- **Good:** one codebase, one build and one accessibility tree (TalkBack works on real controls).
- **Good:** a small bundle; animations run on worklets, so the UI thread stays free.
- **Cost:** no off-the-shelf game editor. Task modules are hand-coded against a shared `TaskModule` interface.
- **Cost:** the team must learn Skia and Reanimated.

## Alternatives considered

- **Unity:** adds 20+ MB, a second toolchain and weak screen-reader support.
- **Phaser in a WebView:** adds input latency, doubles memory use and hurts accessibility.
- **jsPsych:** built for lab experiments, not story games.

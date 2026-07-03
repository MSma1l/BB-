"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Ambient background music. Starts once the intro preloader finishes (it
 * dispatches `bb-intro-done`), loops quietly, and can be toggled with a floating
 * button. Because browsers block audio autoplay-with-sound until a user gesture,
 * we also arm a one-time first-interaction listener as a fallback, and the toggle
 * button always lets the visitor start/stop it. The on/off choice is remembered.
 */
const SRC = "/assets/Moby-Flower.mp3";
const PREF_KEY = "bb_music_off"; // "1" => visitor turned it off

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;

    const wantsOff = (() => {
      try {
        return localStorage.getItem(PREF_KEY) === "1";
      } catch {
        return false;
      }
    })();

    let armed = false;
    const tryPlay = () => {
      if (wantsOff) return;
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          // Autoplay blocked — wait for the first user gesture.
          if (armed) return;
          armed = true;
          const onGesture = () => {
            audio.play().then(() => setPlaying(true)).catch(() => {});
            window.removeEventListener("pointerdown", onGesture);
            window.removeEventListener("keydown", onGesture);
          };
          window.addEventListener("pointerdown", onGesture, { once: true });
          window.addEventListener("keydown", onGesture, { once: true });
        });
    };

    const onIntroDone = () => tryPlay();
    window.addEventListener("bb-intro-done", onIntroDone);
    // In case the intro already finished before this mounted, attempt shortly.
    const t = window.setTimeout(tryPlay, 1200);

    return () => {
      window.removeEventListener("bb-intro-done", onIntroDone);
      window.clearTimeout(t);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      try {
        localStorage.setItem(PREF_KEY, "1");
      } catch {
        /* ignore */
      }
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
      try {
        localStorage.removeItem(PREF_KEY);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <>
      {/* preload="none": don't fetch the ~7MB track until playback actually
          starts (on the intro-done autoplay attempt or the first user gesture),
          so mobile visitors who never enable sound never pay for it (QA-1 MOB
          perf 7.5). The explicit .play() calls trigger the load when needed. */}
      <audio ref={audioRef} src={SRC} loop preload="none" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Mute music" : "Play music"}
        className="fixed z-[60] flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full border-none text-gold-200"
        style={{
          // Offset by the iOS safe area so the button clears the home indicator
          // / rounded corners on notched devices (QA-1 MOB-1).
          bottom: "calc(26px + env(safe-area-inset-bottom))",
          left: "calc(26px + env(safe-area-inset-left))",
          background: "linear-gradient(160deg,#1c0e08,#120a07)",
          border: "1px solid rgba(231,178,76,.32)",
          boxShadow: "0 10px 26px rgba(0,0,0,.5)",
        }}
      >
        {playing ? <Volume2 size={19} /> : <VolumeX size={19} />}
      </button>
    </>
  );
}

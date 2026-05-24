/**
 * useCourseProgress — Track which words a user has "remembered"
 *
 * Strategy:
 *  - Optimistic update: update localStorage immediately so UI feels instant
 *  - If logged in: sync to backend via /api/word-progress
 *  - On mount: fetch server state and merge (server wins for conflicts)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import axiosClient from "../utils/axiosClient";
import { syncRememberedWordProgress } from "../utils/dashboardProgress";

const STORAGE_KEY = "pka_remembered";

function getLocalRemembered() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveLocalRemembered(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function isLoggedIn() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return Boolean(user?.token || user?.id);
  } catch {
    return false;
  }
}

export function useCourseProgress() {
  const [remembered, setRemembered] = useState(getLocalRemembered);
  const isMountedRef = useRef(true);
  const pendingRef = useRef({}); // accumulate changes for batch sync
  const syncTimerRef = useRef(null);

  // ── Load server state on mount ────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    if (!isLoggedIn()) return;

    axiosClient
      .get("/word-progress")
      .then((res) => {
        const serverMap = res || {};
        if (!isMountedRef.current) return;
        // Merge: server state takes precedence (handles multi-device scenarios)
        const local = getLocalRemembered();
        const merged = { ...local, ...serverMap };
        saveLocalRemembered(merged);
        setRemembered(merged);
      })
      .catch((e) =>
        console.warn("[WordProgress] Failed to load from server:", e?.message),
      );

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ── Debounced batch sync to server ────────────────────────────────────────
  const scheduleBatchSync = useCallback(() => {
    if (!isLoggedIn()) return;
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      const pending = pendingRef.current;
      pendingRef.current = {};
      const updates = Object.entries(pending).map(
        ([flashcard_id, is_remembered]) => ({
          flashcard_id: parseInt(flashcard_id, 10),
          is_remembered,
        }),
      );
      if (updates.length === 0) return;
      try {
        await axiosClient.post("/word-progress/batch", { updates });
      } catch (e) {
        console.warn("[WordProgress] Batch sync failed:", e?.message);
      }
    }, 800); // debounce 800ms — batch multiple rapid toggles
  }, []);

  // ── Core save function ────────────────────────────────────────────────────
  const saveRemembered = useCallback(
    (newMap) => {
      const previousMap = remembered;
      setRemembered(newMap);
      saveLocalRemembered(newMap);
      syncRememberedWordProgress(previousMap, newMap);
    },
    [remembered],
  );

  // ── Toggle a single word ──────────────────────────────────────────────────
  const toggleWord = useCallback(
    (wordId) => {
      const newMap = { ...remembered };
      if (newMap[wordId]) {
        delete newMap[wordId];
      } else {
        newMap[wordId] = true;
      }
      saveRemembered(newMap);

      // Queue server sync (only numeric IDs from built-in flashcards)
      const numId = parseInt(wordId, 10);
      if (!isNaN(numId)) {
        pendingRef.current[numId] = Boolean(newMap[wordId]);
        scheduleBatchSync();
      }
    },
    [remembered, saveRemembered, scheduleBatchSync],
  );

  const markWordRemembered = useCallback(
    (wordId, isRemembered = true) => {
      const newMap = { ...remembered };
      if (isRemembered) {
        newMap[wordId] = true;
      } else {
        delete newMap[wordId];
      }
      saveRemembered(newMap);

      const numId = parseInt(wordId, 10);
      if (!isNaN(numId)) {
        pendingRef.current[numId] = isRemembered;
        scheduleBatchSync();
      }
    },
    [remembered, saveRemembered, scheduleBatchSync],
  );

  const replaceRememberedInTopic = useCallback(
    (topicWordIds, selectedWordIds) => {
      const newMap = { ...remembered };
      const selectedSet = new Set(selectedWordIds);

      topicWordIds.forEach((wordId) => {
        if (selectedSet.has(wordId)) {
          newMap[wordId] = true;
        } else {
          delete newMap[wordId];
        }
      });

      saveRemembered(newMap);

      // Batch sync numeric IDs
      topicWordIds.forEach((wordId) => {
        const numId = parseInt(wordId, 10);
        if (!isNaN(numId)) {
          pendingRef.current[numId] = selectedSet.has(wordId);
        }
      });
      scheduleBatchSync();
    },
    [remembered, saveRemembered, scheduleBatchSync],
  );

  return {
    remembered,
    toggleWord,
    markWordRemembered,
    replaceRememberedInTopic,
  };
}

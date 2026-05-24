/**
 * useCustomCourses — Custom (user-owned) topics & words
 *
 * Strategy:
 *  - If user is authenticated → use backend API (source of truth)
 *  - Otherwise → fall back to localStorage (guest mode)
 *  - On first load with API, migrate any existing localStorage data once
 */
import { useState, useEffect, useCallback, useRef } from "react";
import axiosClient from "../utils/axiosClient";

const CUSTOM_KEY = "pka_custom_courses";
const MIGRATED_KEY = "pka_custom_courses_migrated_v1";

// ── localStorage helpers (guest mode & migration) ──────────────────────────
const getLocalCourses = () => {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY)) || [];
  } catch {
    return [];
  }
};
const saveLocalCourses = (courses) =>
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(courses));
const createLocalId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// ── Check if user has a valid token (i.e. is logged in) ────────────────────
function isLoggedIn() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return Boolean(user?.token || user?.id);
  } catch {
    return false;
  }
}

// ── Map API topic to internal format ──────────────────────────────────────
function mapApiTopic(apiTopic) {
  return {
    id: String(apiTopic.id),
    _serverId: apiTopic.id,
    title: apiTopic.title,
    description: apiTopic.description || "",
    lang: "en",
    words: (apiTopic.words || []).map((w) => ({
      id: String(w.id),
      _serverId: w.id,
      word: w.word,
      mean: w.mean || w.meaning,
      transcription: w.transcription || "",
      wordtype: w.wordtype || w.word_type || "",
      example: w.example || "",
      example_vi: w.example_vi || "",
      language: w.language || "en",
    })),
    word_count: apiTopic.word_count || 0,
  };
}

// ── Main hook ──────────────────────────────────────────────────────────────
export function useCustomCourses() {
  const [customCourses, setCustomCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  // ── Migration: push localStorage topics to API once ─────────────────────
  const migrateLocalToServer = useCallback(async (serverTopics) => {
    if (localStorage.getItem(MIGRATED_KEY)) return;
    const local = getLocalCourses();
    if (local.length === 0) {
      localStorage.setItem(MIGRATED_KEY, "1");
      return;
    }
    if (serverTopics.length > 0) {
      localStorage.setItem(MIGRATED_KEY, "1");
      return;
    }

    console.log(
      "[CustomCourses] Migrating localStorage topics to server…",
      local.length,
    );
    for (const topic of local) {
      try {
        const res = await axiosClient.post("/courses/custom/topics", {
          title: topic.title,
          description: topic.description || "",
          lang: topic.lang || "en",
        });
        const newTopicId = res?.id;
        if (newTopicId && Array.isArray(topic.words)) {
          for (const w of topic.words) {
            try {
              await axiosClient.post(
                `/courses/custom/topics/${newTopicId}/words`,
                {
                  word: w.word,
                  mean: w.mean || w.meaning,
                  transcription: w.transcription,
                  wordtype: w.wordtype,
                  example: w.example,
                  example_vi: w.example_vi,
                  language: w.language || "en",
                },
              );
            } catch (err) {
              console.warn("Word migration failed:", w.word, err?.message);
            }
          }
        }
      } catch (err) {
        console.warn("Topic migration failed:", topic.title, err?.message);
      }
    }
    localStorage.setItem(MIGRATED_KEY, "1");
    console.log("[CustomCourses] Migration done!");
  }, []);

  // ── Load from API ────────────────────────────────────────────────────────
  const loadFromServer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/courses/custom/topics");
      const topics = (Array.isArray(res) ? res : []).map(mapApiTopic);
      if (isMountedRef.current) setCustomCourses(topics);
      await migrateLocalToServer(topics);
      // Reload after possible migration
      const res2 = await axiosClient.get("/courses/custom/topics");
      const topics2 = (Array.isArray(res2) ? res2 : []).map(mapApiTopic);
      if (isMountedRef.current) setCustomCourses(topics2);
    } catch (e) {
      console.warn(
        "[CustomCourses] API load failed, using localStorage:",
        e?.message,
      );
      if (isMountedRef.current) setCustomCourses(getLocalCourses());
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [migrateLocalToServer]);

  useEffect(() => {
    isMountedRef.current = true;
    if (isLoggedIn()) {
      loadFromServer();
    } else {
      setCustomCourses(getLocalCourses());
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [loadFromServer]);

  // ── TOPIC CRUD ────────────────────────────────────────────────────────────

  const createTopic = useCallback(
    async ({ title, description, lang }) => {
      if (!title?.trim()) return { error: "Tên chủ đề không được để trống." };
      if (!isLoggedIn()) {
        // Guest mode
        const local = getLocalCourses();
        if (
          local.some(
            (t) => t.title.trim().toLowerCase() === title.trim().toLowerCase(),
          )
        ) {
          return { error: "Tên chủ đề đã tồn tại." };
        }
        const newTopic = {
          id: createLocalId("custop"),
          title,
          description,
          lang: lang || "en",
          words: [],
        };
        const updated = [...local, newTopic];
        saveLocalCourses(updated);
        setCustomCourses(updated);
        return newTopic;
      }
      try {
        await axiosClient.post("/courses/custom/topics", {
          title: title.trim(),
          description,
          lang,
        });
        await loadFromServer();
        return {};
      } catch (e) {
        return { error: e?.response?.data?.error || "Tạo chủ đề thất bại." };
      }
    },
    [loadFromServer],
  );

  const updateTopic = useCallback(
    async (topicId, { title, description, lang }) => {
      if (!isLoggedIn()) {
        const local = getLocalCourses();
        const idx = local.findIndex((t) => t.id === topicId);
        if (idx === -1) return { error: "Không tìm thấy chủ đề." };
        local[idx] = { ...local[idx], title, description, lang };
        saveLocalCourses(local);
        setCustomCourses([...local]);
        return local[idx];
      }
      try {
        const t = customCourses.find((c) => c.id === String(topicId));
        const serverId = t?._serverId || topicId;
        await axiosClient.put(`/courses/custom/topics/${serverId}`, {
          title: title.trim(),
          description,
        });
        await loadFromServer();
        return {};
      } catch (e) {
        return { error: e?.response?.data?.error || "Cập nhật thất bại." };
      }
    },
    [customCourses, loadFromServer],
  );

  const deleteTopic = useCallback(
    async (topicId) => {
      if (!isLoggedIn()) {
        const updated = getLocalCourses().filter((t) => t.id !== topicId);
        saveLocalCourses(updated);
        setCustomCourses(updated);
        return;
      }
      try {
        const t = customCourses.find((c) => c.id === String(topicId));
        const serverId = t?._serverId || topicId;
        await axiosClient.delete(`/courses/custom/topics/${serverId}`);
        await loadFromServer();
      } catch (e) {
        console.error("[CustomCourses] deleteTopic failed:", e?.message);
      }
    },
    [customCourses, loadFromServer],
  );

  // ── WORD CRUD ─────────────────────────────────────────────────────────────

  const addWordToTopic = useCallback(
    async (topicId, wordData) => {
      if (!isLoggedIn()) {
        const local = getLocalCourses();
        const topic = local.find((t) => t.id === topicId);
        if (!topic) return { error: "Không tìm thấy chủ đề." };
        if (
          topic.words.some(
            (w) => w.word?.toLowerCase() === wordData.word?.toLowerCase(),
          )
        ) {
          return {
            error: `Từ "${wordData.word}" đã tồn tại trong chủ đề này.`,
          };
        }
        topic.words.push({ id: createLocalId("cuswd"), ...wordData });
        saveLocalCourses(local);
        setCustomCourses([...local]);
        return {};
      }
      try {
        const t = customCourses.find((c) => c.id === String(topicId));
        const serverId = t?._serverId || topicId;
        await axiosClient.post(
          `/courses/custom/topics/${serverId}/words`,
          wordData,
        );
        await loadFromServer();
        return {};
      } catch (e) {
        return { error: e?.response?.data?.error || "Thêm từ thất bại." };
      }
    },
    [customCourses, loadFromServer],
  );

  const updateWordInTopic = useCallback(
    async (topicId, wordId, updates) => {
      if (!isLoggedIn()) {
        const local = getLocalCourses();
        const topic = local.find((t) => t.id === topicId);
        if (topic) {
          const w = topic.words.find((x) => x.id === wordId);
          if (w) Object.assign(w, updates);
          saveLocalCourses(local);
          setCustomCourses([...local]);
        }
        return;
      }
      try {
        const t = customCourses.find((c) => c.id === String(topicId));
        const topicServerId = t?._serverId || topicId;
        const word = t?.words?.find((w) => w.id === String(wordId));
        const wordServerId = word?._serverId || wordId;
        await axiosClient.put(
          `/courses/custom/topics/${topicServerId}/words/${wordServerId}`,
          updates,
        );
        await loadFromServer();
      } catch (e) {
        console.error("[CustomCourses] updateWord failed:", e?.message);
      }
    },
    [customCourses, loadFromServer],
  );

  const deleteWordFromTopic = useCallback(
    async (topicId, wordId) => {
      if (!isLoggedIn()) {
        const local = getLocalCourses();
        const topic = local.find((t) => t.id === topicId);
        if (topic) {
          topic.words = topic.words.filter((w) => w.id !== wordId);
          saveLocalCourses(local);
          setCustomCourses([...local]);
        }
        return;
      }
      try {
        const t = customCourses.find((c) => c.id === String(topicId));
        const topicServerId = t?._serverId || topicId;
        const word = t?.words?.find((w) => w.id === String(wordId));
        const wordServerId = word?._serverId || wordId;
        await axiosClient.delete(
          `/courses/custom/topics/${topicServerId}/words/${wordServerId}`,
        );
        await loadFromServer();
      } catch (e) {
        console.error("[CustomCourses] deleteWord failed:", e?.message);
      }
    },
    [customCourses, loadFromServer],
  );

  const addManyWordsToTopic = useCallback(
    async (topicId, wordArray) => {
      let added = 0;
      let skipped = 0;
      for (const w of wordArray) {
        const result = await addWordToTopic(topicId, w);
        if (result?.error) skipped++;
        else added++;
      }
      return { added, skipped };
    },
    [addWordToTopic],
  );

  return {
    customCourses,
    loading,
    createTopic,
    updateTopic,
    deleteTopic,
    addWordToTopic,
    updateWordInTopic,
    deleteWordFromTopic,
    addManyWordsToTopic,
    refresh: loadFromServer,
  };
}

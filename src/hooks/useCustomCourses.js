import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/useAuth";
import axiosClient from "../utils/axiosClient";

const normalizeLanguage = (value, fallback = "en") => {
  const language = String(value || "").trim().toLowerCase();
  return language || fallback;
};

const isAuthenticatedUser = (user) =>
  Boolean(user?.id || user?.profileId || user?.authUserId || user?.token);

const mapApiWord = (word, topicLanguage = "en") => {
  const language = normalizeLanguage(word?.language || word?.lang, topicLanguage);
  return {
    id: String(word.id),
    _serverId: word.id,
    word: word.word,
    mean: word.mean || word.meaning,
    transcription: word.transcription || "",
    wordtype: word.wordtype || word.word_type || "",
    example: word.example || "",
    example_vi: word.example_vi || "",
    language,
  };
};

const mapApiTopic = (apiTopic) => {
  const language = normalizeLanguage(apiTopic?.language || apiTopic?.lang, "en");
  return {
    id: String(apiTopic.id),
    _serverId: apiTopic.id,
    title: apiTopic.title,
    description: apiTopic.description || "",
    lang: language,
    language,
    sharedFromTopicId: apiTopic.shared_from_topic_id || apiTopic.sharedFromTopicId || null,
    words: (apiTopic.words || []).map((word) => mapApiWord(word, language)),
    word_count: apiTopic.word_count || apiTopic.words?.length || 0,
  };
};

export function useCustomCourses() {
  const { user } = useAuth();
  const [customCourses, setCustomCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  const loadFromServer = useCallback(async () => {
    if (!isAuthenticatedUser(user)) {
      if (isMountedRef.current) {
        setCustomCourses([]);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await axiosClient.get("/courses/custom/topics");
      const topics = (Array.isArray(res) ? res : []).map(mapApiTopic);
      if (isMountedRef.current) {
        setCustomCourses(topics);
      }
    } catch (e) {
      console.warn("[CustomCourses] API load failed:", e?.message);
      if (isMountedRef.current) {
        setCustomCourses([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    isMountedRef.current = true;
    loadFromServer();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadFromServer]);

  const createTopic = useCallback(
    async ({ title, description, lang, sharedTopicId }) => {
      if (!title?.trim()) {
        return { error: "Tên chủ đề không được để trống." };
      }
      if (!isAuthenticatedUser(user)) {
        return { error: "Bạn cần đăng nhập để tạo chủ đề." };
      }

      try {
        const createdTopic = await axiosClient.post("/courses/custom/topics", {
          title: title.trim(),
          description,
          lang: normalizeLanguage(lang, "en"),
          sharedTopicId: sharedTopicId ? String(sharedTopicId).trim() : null,
        });
        await loadFromServer();
        return mapApiTopic(createdTopic?.data || createdTopic);
      } catch (e) {
        return { error: e?.response?.data?.error || "Tạo chủ đề thất bại." };
      }
    },
    [loadFromServer, user],
  );

  const updateTopic = useCallback(
    async (topicId, { title, description, lang }) => {
      if (!isAuthenticatedUser(user)) {
        return { error: "Bạn cần đăng nhập để cập nhật chủ đề." };
      }

      try {
        const topic = customCourses.find((course) => course.id === String(topicId));
        const serverId = topic?._serverId || topicId;
        await axiosClient.put(`/courses/custom/topics/${serverId}`, {
          title: title.trim(),
          description,
          lang: normalizeLanguage(lang || topic?.lang, "en"),
        });
        await loadFromServer();
        return {};
      } catch (e) {
        return { error: e?.response?.data?.error || "Cập nhật thất bại." };
      }
    },
    [customCourses, loadFromServer, user],
  );

  const deleteTopic = useCallback(
    async (topicId) => {
      if (!isAuthenticatedUser(user)) {
        return { error: "Bạn cần đăng nhập để xóa chủ đề." };
      }

      try {
        const topic = customCourses.find((course) => course.id === String(topicId));
        const serverId = topic?._serverId || topicId;
        await axiosClient.delete(`/courses/custom/topics/${serverId}`);
        await loadFromServer();
        return {};
      } catch (e) {
        return { error: e?.response?.data?.error || "Xóa chủ đề thất bại." };
      }
    },
    [customCourses, loadFromServer, user],
  );

  const addWordToTopic = useCallback(
    async (topicId, wordData) => {
      if (!isAuthenticatedUser(user)) {
        return { error: "Bạn cần đăng nhập để thêm từ." };
      }

      const topic = customCourses.find((course) => course.id === String(topicId));
      if (!topic) {
        return { error: "Không tìm thấy chủ đề." };
      }

      const topicLanguage = normalizeLanguage(topic.lang || topic.language, "en");
      const wordLanguage = normalizeLanguage(wordData?.language || wordData?.lang, topicLanguage);
      if (wordLanguage !== topicLanguage) {
        return { error: "Từ vựng không khớp ngôn ngữ của chủ đề." };
      }

      try {
        const serverId = topic._serverId || topicId;
        await axiosClient.post(`/courses/custom/topics/${serverId}/words`, {
          ...wordData,
          language: topicLanguage,
        });
        await loadFromServer();
        return {};
      } catch (e) {
        return { error: e?.response?.data?.error || "Thêm từ thất bại." };
      }
    },
    [customCourses, loadFromServer, user],
  );

  const updateWordInTopic = useCallback(
    async (topicId, wordId, updates) => {
      if (!isAuthenticatedUser(user)) {
        return { error: "Bạn cần đăng nhập để cập nhật từ." };
      }

      try {
        const topic = customCourses.find((course) => course.id === String(topicId));
        const serverTopicId = topic?._serverId || topicId;
        const word = topic?.words?.find((item) => item.id === String(wordId));
        const serverWordId = word?._serverId || wordId;
        await axiosClient.put(
          `/courses/custom/topics/${serverTopicId}/words/${serverWordId}`,
          updates,
        );
        await loadFromServer();
        return {};
      } catch (e) {
        return { error: e?.response?.data?.error || "Cập nhật từ thất bại." };
      }
    },
    [customCourses, loadFromServer, user],
  );

  const deleteWordFromTopic = useCallback(
    async (topicId, wordId) => {
      if (!isAuthenticatedUser(user)) {
        return { error: "Bạn cần đăng nhập để xóa từ." };
      }

      try {
        const topic = customCourses.find((course) => course.id === String(topicId));
        const serverTopicId = topic?._serverId || topicId;
        const word = topic?.words?.find((item) => item.id === String(wordId));
        const serverWordId = word?._serverId || wordId;
        await axiosClient.delete(
          `/courses/custom/topics/${serverTopicId}/words/${serverWordId}`,
        );
        await loadFromServer();
        return {};
      } catch (e) {
        return { error: e?.response?.data?.error || "Xóa từ thất bại." };
      }
    },
    [customCourses, loadFromServer, user],
  );

  const addManyWordsToTopic = useCallback(
    async (topicId, wordArray) => {
      let added = 0;
      let skipped = 0;
      for (const word of wordArray) {
        const result = await addWordToTopic(topicId, word);
        if (result?.error) skipped += 1;
        else added += 1;
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

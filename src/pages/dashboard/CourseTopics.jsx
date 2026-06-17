import { useEffect, useState } from "react";
import ConfirmActionModal from "../../components/common/ConfirmActionModal";
import { Link, useNavigate, useParams } from "react-router-dom";
import TopicFormModal from "../../components/customDocs/TopicFormModal";
import { useAuth } from "../../contexts/useAuth";
import { getGuestReadyCourseTopics, isGuestReadyCourseId } from "../../data/guestToeicCourses";
import axiosClient from "../../utils/axiosClient";
import { useCourseProgress } from "../../hooks/useCourseProgress";
import { useCustomCourses } from "../../hooks/useCustomCourses";
import { isAuthenticatedUser } from "../../utils/userStorage";

export default function CourseTopics() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { remembered } = useCourseProgress();
  const { customCourses, createTopic, updateTopic, deleteTopic } =
    useCustomCourses();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm] = useState({
    title: "",
    description: "",
    lang: "en",
  });
  const [toastMessage, setToastMessage] = useState("");
  const [pendingDeleteTopic, setPendingDeleteTopic] = useState(null);

  const openTopicModal = (topicId = null) => {
    if (topicId) {
      const topic = customCourses.find(
        (customTopic) => customTopic.id === topicId,
      );
      setEditingTopic(topic || null);
      setTopicForm({
        title: topic?.title || "",
        description: topic?.description || "",
        lang: topic?.lang || "en",
      });
    } else {
      setEditingTopic(null);
      setTopicForm({ title: "", description: "", lang: "en" });
    }

    setModalOpen(true);
  };

  const handleSaveTopic = async () => {
    if (!topicForm.title.trim()) {
      setToastMessage("Vui lòng nhập tên chủ đề");
      return;
    }

    const result = editingTopic
      ? await updateTopic(editingTopic.id, topicForm)
      : await createTopic(topicForm);
    if (result?.error) {
      setToastMessage(result.error);
      return;
    }

    setModalOpen(false);
    setEditingTopic(null);
    setTopicForm({ title: "", description: "", lang: "en" });
    setToastMessage("");
  };

  const handleDeleteTopic = (topicId) => {
    deleteTopic(topicId);
    setPendingDeleteTopic(null);
    setToastMessage("Đã xóa chủ đề");
  };

  const [courseTitle, setCourseTitle] = useState("");
  const [apiTopics, setApiTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (courseId === "custom") return;
    const useGuestCatalog = isGuestReadyCourseId(courseId);

    if (useGuestCatalog) {
      const guestCourse = getGuestReadyCourseTopics(courseId);
      setCourseTitle(guestCourse?.courseTitle || guestCourse?.title || "");
      setApiTopics(Array.isArray(guestCourse?.topics) ? guestCourse.topics : []);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    axiosClient
      .get(`/courses/${courseId}/topics`)
      .then((res) => {
        if (!cancelled) {
          const data = res.data || res;
          setCourseTitle(data?.courseTitle || data?.title || "");
          setApiTopics(
            Array.isArray(data?.topics)
              ? data.topics
              : Array.isArray(data)
                ? data
                : [],
          );
        }
      })
      .catch((err) => {
        console.error("Fetch course topics error:", err);
        if (!cancelled) {
          setCourseTitle("");
          setApiTopics([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, user]);

  useEffect(() => {
    const revealEls = Array.from(
      document.querySelectorAll(".cv-topics-grid .reveal"),
    );
    if (!revealEls.length) return;

    revealEls.forEach((el, index) => {
      const revealOrder = Number(el.dataset.revealOrder ?? index);
      el.style.setProperty("--reveal-delay", `${revealOrder * 50}ms`);
      el.classList.remove("revealed");
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px 0px 0px",
      },
    );

    revealEls.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        el.classList.add("revealed");
      } else {
        revealObserver.observe(el);
      }
    });

    return () => revealObserver.disconnect();
  }, [apiTopics]);

  let title = "";
  let topics = [];

  if (courseId === "custom") {
    title = "Tài liệu của bạn";
    topics = customCourses.map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: topic.description || "Chủ đề tùy chỉnh",
      words: topic.words,
    }));
  } else {
    title = courseTitle;
    topics = apiTopics;

    if (!loading && !title && apiTopics.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>Topic không tồn tại hoặc đang được phát triển.</h2>
          <br />
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/dashboard/courses")}
          >
            Quay lại
          </button>
        </div>
      );
    }
  }

  return (
    <main
      className="dash-main cv-subview"
      id="cv-topics-view"
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      <div className="cv-subview-header">
        <Link className="cv-breadcrumb-btn" to="/dashboard/courses">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="currentColor"
          >
            <path d="M7.828 11H20v2H7.828l5.364 5.364-1.414 1.414L4 12l7.778-7.778 1.414 1.414z" />
          </svg>
          <span id="cv-back-course-label">
            {courseId === "custom" ? "Tài liệu của bạn" : "Tất cả tài liệu"}
          </span>
        </Link>
        <span className="cv-breadcrumb-sep">›</span>
        <span className="cv-breadcrumb-current" id="cv-topic-title">
          {title}
        </span>
      </div>

      {courseId === "custom" ? (
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-primary" onClick={() => openTopicModal()}>
            + Tạo chủ đề mới
          </button>
        </div>
      ) : null}

      <div className="cv-topics-grid">
        {topics.length === 0 && courseId === "custom" ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "var(--gray-text)",
              gridColumn: "1 / -1",
            }}
          >
            Bạn chưa có tài liệu cá nhân nào. Hãy quay lại trang Topic và chuyển
            sang tab "Cá nhân" để thêm nhé!
          </div>
        ) : null}

        {topics.map((topic) => {
          const total = Array.isArray(topic.words)
            ? topic.words.length
            : topic.vocabularyCount || topic.wordCount || 0;
          const done = Array.isArray(topic.words)
            ? topic.words.filter((word) => remembered[word.id]).length
            : 0;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          const match = topic.title.match(
            /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*/u,
          );
          const emoji = match ? match[0].trim() : "📚";
          const textTitle = match
            ? topic.title.replace(match[0], "").trim()
            : topic.title;

          return (
            <div
              key={topic.id}
              className="cv-topic-card reveal"
              onClick={() =>
                navigate(
                  `/dashboard/courses/${courseId}/topic/${topic.slug || topic.id}`,
                )
              }
            >
              <div className="cv-topic-left">
                <div className="cv-topic-emoji">{emoji}</div>
                <div className="cv-topic-info">
                  <div className="cv-topic-name">{textTitle}</div>
                  <div className="cv-topic-desc">
                    {topic.description || `${total} từ vựng mới`}
                  </div>
                </div>
              </div>

              <div className="cv-topic-right">
                {courseId === "custom" ? (
                  <div className="cv-icon-btns">
                    <button
                      className="cv-icon-btn cv-cc-edit"
                      title="Sửa chủ đề"
                      onClick={(event) => {
                        event.stopPropagation();
                        openTopicModal(topic.id);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="currentColor"
                      >
                        <path d="M15.7279 9.57629L14.3137 8.16207L5 17.4758V18.89H6.41421L15.7279 9.57629ZM17.1421 8.16207L18.5563 6.74786L17.1421 5.33365L15.7279 6.74786L17.1421 8.16207ZM7.24264 20.89H3V16.6474L16.435 3.21233C16.8256 2.8218 17.4587 2.8218 17.8492 3.21233L20.6777 6.04075C21.0682 6.43128 21.0682 7.06444 20.6777 7.45497L7.24264 20.89Z" />
                      </svg>
                    </button>
                    <button
                      className="cv-icon-btn cv-cc-delete"
                      title="Xóa chủ đề"
                      style={{ "--icon-color": "var(--red)" }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setPendingDeleteTopic(topic);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="currentColor"
                      >
                        <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="cv-topic-progress-wrap">
                    <div className="cv-topic-bar">
                      <div
                        className="cv-topic-bar-fill"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <span className="cv-topic-pct">
                      {done}/{total}
                    </span>
                  </div>
                )}

                <svg
                  className="cv-topic-arrow"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                >
                  <path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      <TopicFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTopic(null);
          setTopicForm({ title: "", description: "", lang: "en" });
          setToastMessage("");
        }}
        onSave={handleSaveTopic}
        topicForm={topicForm}
        setTopicForm={setTopicForm}
        editingTopic={editingTopic}
        toastMessage={toastMessage}
        onToastHide={() => setToastMessage("")}
      />

      <ConfirmActionModal
        isOpen={Boolean(pendingDeleteTopic)}
        onClose={() => setPendingDeleteTopic(null)}
        onConfirm={() => handleDeleteTopic(pendingDeleteTopic.id)}
        title="Xác nhận xóa chủ đề"
        message={
          pendingDeleteTopic
            ? `Bạn có chắc muốn xóa chủ đề "${pendingDeleteTopic.title}" không?`
            : ""
        }
        confirmLabel="Xóa chủ đề"
      />
    </main>
  );
}

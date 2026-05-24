import { Link } from 'react-router-dom';
import './LandingPage.css';

import { useLandingReveal, useCounterAnimation } from './hooks';
import { FEATURES, AVATARS, SVGS, COURSE_CARDS } from '../../data/landingData';
import CourseCard from './CourseCard';

// ── Component ───────────────────────────────────────────────────────────────
export default function LandingPage() {
    useLandingReveal();
    useCounterAnimation();

    return (
        <>
            {/* ── HERO (existing, kept intact) ── */}
            <header className="hero" id="hero-section">
                <div className="hero-left">
                    <div className="lp-eyebrow lp-eyebrow-blue"><span style={{ backgroundColor: 'var(--blue)', color: '#fff', borderRadius: '10px', padding: '2px 7px', fontSize: '12px', fontWeight: 'bold' }}>New</span> Học thử miễn phí ngay!</div>
                    <h1 className="be-vietnam-pro-extrabold">Học và ghi nhớ từ vựng hiệu quả cùng <span className="name-logo">pkastudy</span> ngay hôm nay!</h1>
                    <p>
                        Học từ vựng tiếng Anh và tiếng Hàn dễ hơn qua bộ từ theo chủ đề, phát âm chuẩn,
                        luyện nghe thực tế, flashcard trực quan và trợ lý AI luôn sẵn sàng hỗ trợ.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/dashboard">
                            <button className="btn btn-primary hero-btn" id="btn-get-started">Bắt đầu ngay</button>
                        </Link>
                        <Link to="/login">
                            <button className="btn btn-secondary hero-btn">Đã có tài khoản</button>
                        </Link>
                    </div>
                </div>

            </header >

            {/* ══════════════════════════════════════════
                SECTION 1: GIỚI THIỆU - Features
            ══════════════════════════════════════════ */}
            < section className="lp-section lp-features" id="gioi-thieu" >
                <div className="lp-container">
                    <div className="lp-features-header lp-reveal">
                        <div className="lp-eyebrow lp-eyebrow-blue">
                            {/* {SVGS[1].svg}  */}
                            Giới thiệu tính năng
                        </div>
                        <h2 className="lp-heading be-vietnam-pro-extrabold">Các <span className="name-logo">tính năng</span> chính</h2>
                        <p className="lp-subheading">
                            Khám phá 4 trải nghiệm nổi bật: hỏi đáp cùng AI, học bằng nhiều chế độ khác nhau, ôn luyện với kho từ vựng theo chủ đề và vừa chơi vừa học qua các hoạt động tương tác sinh động.
                        </p>
                    </div>

                    <div className="lp-features-grid">
                        {FEATURES.map((feat, i) => (
                            <div
                                key={i}
                                className={`lp-feat-card lp-feat-card--${feat.tone} lp-reveal`}
                                style={{ transitionDelay: `${i * 80}ms` }}
                            >
                                <div className={`lp-feat-icon lp-feat-icon--${feat.tone}`}>
                                    {feat.icon}
                                </div>
                                <h3 className="lp-feat-title">{feat.title}</h3>
                                <p className="lp-feat-desc">{feat.desc}</p>
                            </div>
                        ))}
                    </div>

                </div>
            </section >

            {/* ══════════════════════════════════════════
                SECTION 2: KHÓA HỌC - Courses preview
            ══════════════════════════════════════════ */}
            < section className="lp-section lp-courses" id="tai-lieu" >
                <div className="lp-container">
                    <div className="lp-courses-layout">

                        {/* Left: text */}
                        <div className="lp-courses-text lp-reveal">
                            <div>
                                <div className="lp-eyebrow lp-eyebrow-blue">
                                    {/* {SVGS[2].svg}  */}
                                    Danh sách tài liệu
                                </div>
                                <h2 className="lp-heading be-vietnam-pro-extrabold" >Xây dựng vốn từ, học đâu nhớ đó cùng <span className="name-logo">pkastudy.</span></h2>
                                <p className="lp-subheading">
                                    Hai bộ từ vựng chuẩn quốc tế được biên soạn bám sát đề thi thực tế,
                                    kèm phiên âm và ví dụ giúp bạn học đúng từ đầu.
                                </p>
                            </div>

                            <div className="lp-courses-cta">
                                <Link to="/dashboard/courses" className="lp-btn lp-btn--primary lp-cta-btn">
                                    Xem tài liệu
                                </Link>
                                <Link to="/dashboard/courses?tab=custom" className="lp-btn lp-btn--secondary lp-cta-btn">
                                    Bộ từ cá nhân
                                </Link>
                            </div>

                            <p
                                style={{
                                    fontSize: '13px',
                                    color: 'var(--gray-light)',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {SVGS[3].svg} Bạn có thể học thử ngay mà không cần đăng nhập!
                            </p>
                        </div>

                        {/* Right: cards */}
                        <div className="lp-courses-cards">
                            {COURSE_CARDS.map((card, i) => (
                                <CourseCard key={i} {...card} />
                            ))}
                        </div>

                    </div>
                </div>
            </section >

            {/* ══════════════════════════════════════════
                SECTION 3: Chatbot AI
            ══════════════════════════════════════════ */}
            < section className="lp-section lp-ai" id="chatbot-ai" >
                <div className="lp-container">
                    <div className="lp-ai-shell">
                        <div className="lp-ai-copy lp-reveal">
                            <div className="lp-eyebrow lp-eyebrow-blue" style={{ width: 'fit-content' }}>
                                {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="currentColor" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                    <path d="M20.5 16.9286V10C20.5 6.22876 20.5 4.34315 19.3284 3.17157C18.1569 2 16.2712 2 12.5 2H11.5C7.72876 2 5.84315 2 4.67157 3.17157C3.5 4.34315 3.5 6.22876 3.5 10V19.5" />
                                    <path d="M20.5 17H6C4.61929 17 3.5 18.1193 3.5 19.5C3.5 20.8807 4.61929 22 6 22H20.5" />
                                    <path d="M20.5 22C19.1193 22 18 20.8807 18 19.5C18 18.1193 19.1193 17 20.5 17" />
                                    <path d="M12.3077 12L10.847 7.47891C10.7552 7.19466 10.4734 7 10.1538 7C9.83425 7 9.55249 7.19466 9.46066 7.47891L8 12M15 7V12M8.53846 10.5H11.7692" />
                                </svg>  */}
                                Hệ thống Chatbot AI
                            </div>
                            <h2 className="lp-heading be-vietnam-pro-extrabold">
                                <span className="name-logo">Trợ lý AI</span> giúp bạn tối ưu thời gian, học tập hiệu quả.
                            </h2>
                            <p className="lp-subheading">
                                Từ hỏi đáp từ vựng, ngữ pháp và phát âm đến tạo bộ từ theo chủ đề, trợ lý AI trong
                                pkastudy được xây để rút ngắn thời gian hiểu bài và biến việc ôn tập thành một luồng học liền mạch.
                            </p>

                            <div className="lp-ai-feature-list">
                                <article className="lp-ai-feature-row">
                                    <span className="lp-ai-feature-index">01</span>
                                    <div>
                                        <strong>Hỏi điều bạn cần ngay lập tức</strong>
                                        <p>Tra nghĩa từ, ngữ pháp, phát âm, cách dùng và ví dụ thực tế trong một cuộc hội thoại tự nhiên.</p>
                                    </div>
                                </article>
                                <article className="lp-ai-feature-row">
                                    <span className="lp-ai-feature-index">02</span>
                                    <div>
                                        <strong>Đào sâu từng từ vựng</strong>
                                        <p>Từ màn hình học từ vựng, bạn có thể hỏi AI chi tiết hơn để hiểu kỹ một từ trước khi ghi nhớ.</p>
                                    </div>
                                </article>
                                <article className="lp-ai-feature-row">
                                    <span className="lp-ai-feature-index">03</span>
                                    <div>
                                        <strong>Tạo nội dung học thật nhanh</strong>
                                        <p>Tạo nhanh bộ từ theo chủ đề với nghĩa, phiên âm và câu ví dụ để đưa thẳng vào quy trình học.</p>
                                    </div>
                                </article>
                            </div>
                        </div>

                        <div className="lp-ai-stage lp-reveal" style={{ transitionDelay: '90ms' }}>
                            <div className="lp-ai-workspace">
                                <div className="lp-ai-commandbar">
                                    <span className="lp-ai-command-label">AI hỗ trợ 24/7</span>
                                    <button
                                        type="button"
                                        className="lp-btn lp-btn--primary lp-ai-launch-btn"
                                        onClick={() => window.dispatchEvent(new CustomEvent('toggleFloatChat'))}
                                    >
                                        Thử ngay
                                    </button>
                                </div>

                                <div className="lp-ai-card lp-ai-card-chat">
                                    <div className="lp-ai-card-top">
                                        <span className="lp-ai-chip">Trợ lý trực tuyến</span>
                                        <span className="lp-ai-card-meta">Sẵn sàng hỗ trợ</span>
                                    </div>
                                    <div className="lp-ai-conversation">
                                        <div className="lp-ai-line lp-ai-line-user">
                                            Giải thích từ <strong>allocate</strong> thật dễ hiểu giúp mình.
                                        </div>
                                        <div className="lp-ai-line lp-ai-line-bot">
                                            <strong>allocate</strong> có nghĩa là phân bổ hoặc dành ra cho một mục đích cụ thể.
                                            Ví dụ: “We allocated more time to speaking practice.”
                                        </div>
                                    </div>
                                </div>

                                <div className="lp-ai-grid">
                                    <article className="lp-ai-card lp-ai-card-mini">
                                        <span className="lp-ai-mini-label">Hỗ trợ theo từ</span>
                                        <strong>Hỏi AI ngay trong lúc học từ vựng</strong>
                                        <p>Xem giải thích sâu hơn cho từng từ mà không cần rời khỏi mạch học.</p>
                                    </article>
                                    <article className="lp-ai-card lp-ai-card-mini">
                                        <span className="lp-ai-mini-label">Tạo nhanh hàng loạt</span>
                                        <strong>Tạo bộ từ theo chủ đề chỉ trong vài giây</strong>
                                        <p>Tạo danh sách từ cho 5 ngôn ngữ với nghĩa, phiên âm và ví dụ đi kèm.</p>
                                    </article>
                                    <article className="lp-ai-card lp-ai-card-wide">
                                        <span className="lp-ai-mini-label">Luồng học liền mạch</span>
                                        <strong>Tạo từ, lưu vào danh sách, rồi tiếp tục ôn bằng flashcard, quiz, listening và typing.</strong>
                                        <div className="lp-ai-tag-row">
                                            <span className="lp-ai-tag">Giải thích</span>
                                            <span className="lp-ai-tag">Sửa lỗi</span>
                                            <span className="lp-ai-tag">Tạo từ</span>
                                            <span className="lp-ai-tag">Luyện tập</span>
                                        </div>
                                    </article>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section >

        </>
    );
}

import { useEffect, useRef, useState } from 'react';
import flappyLogo from '../../assets/images/logo-flappybird.png';
import FlappyBirdExperience, { GAME_CARD, GAME_ID } from '../../components/games/FlappyBirdExperience';

export default function Games() {
    const [activeGameId, setActiveGameId] = useState(null);
    const pageRef = useRef(null);

    useEffect(() => {
        const pageEl = pageRef.current;
        if (!pageEl) return undefined;

        const topbarEl = document.querySelector('.topbar');
        const mobileNavEl = document.querySelector('.mobile-nav');

        const updateViewportVars = () => {
            const topbarHeight = topbarEl?.getBoundingClientRect().height || 0;
            const mobileNavVisible = mobileNavEl ? window.getComputedStyle(mobileNavEl).display !== 'none' : false;
            const mobileNavHeight = mobileNavVisible ? (mobileNavEl?.getBoundingClientRect().height || 0) : 0;

            pageEl.style.setProperty('--games-dashboard-topbar-h', `${Math.round(topbarHeight)}px`);
            pageEl.style.setProperty('--games-mobile-nav-h', `${Math.round(mobileNavHeight)}px`);
        };

        updateViewportVars();

        const resizeObserver = new ResizeObserver(() => {
            updateViewportVars();
        });

        if (topbarEl) resizeObserver.observe(topbarEl);
        if (mobileNavEl) resizeObserver.observe(mobileNavEl);

        window.addEventListener('resize', updateViewportVars);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateViewportVars);
        };
    }, []);

    return (
        <main
            ref={pageRef}
            className={`dash-main games-page${activeGameId === GAME_ID ? ' is-game-active' : ''}`}
            id="page-games"
        >
            {activeGameId === GAME_ID ? (
                <FlappyBirdExperience onBackGallery={() => setActiveGameId(null)} />
            ) : (
                <section className="games-hub">
                    <div className="games-hero">
                        <div>
                            <div className="games-eyebrow">Ôn tập từ vựng</div>
                            <h1>Chọn trò chơi để bắt đầu</h1>
                            <p>
                                Ôn lại những từ vựng bạn đã đánh dấu là đã thuộc trong các topic của một ngôn ngữ. Tại đây, bạn sẽ luyện lại các từ đó thông qua những trò chơi tương tác.
                            </p>
                        </div>
                    </div>

                    <div className="games-grid">
                        <button type="button" className="game-card-image-button" onClick={() => setActiveGameId(GAME_ID)} aria-label={GAME_CARD.title}>
                            <img className="game-card-image" src={flappyLogo} alt={GAME_CARD.title} />
                        </button>
                    </div>
                </section>
            )}
        </main>
    );
}

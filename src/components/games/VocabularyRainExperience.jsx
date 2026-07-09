import { useEffect, useMemo, useRef, useState } from 'react';
import { playCorrectSound, playIncorrectSound } from '../../utils/feedbackAudio';
import { getSpeechLang } from '../../utils/studyModes';
import '../../assets/css/rain-game.css';
/* eslint-disable react-hooks/exhaustive-deps */

const MIN_PLAYABLE_WORDS = 2;
const START_LIVES = 3;
const MAX_ROUNDS = 12;
const MIN_ROUNDS = 6;

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function normalizeWordItem(word) {
  if (!word) return null;
  const id = word.id ?? word.flashcardId ?? word.wordId ?? word.word;
  const text = String(word.word || '').trim();
  const mean = String(word.mean || '').trim();

  if (!id || !text || !mean) return null;

  return {
    ...word,
    id,
    word: text,
    mean,
  };
}

function dedupeWords(words = []) {
  const seen = new Set();
  return words
    .map(normalizeWordItem)
    .filter(Boolean)
    .filter((word) => {
      const key = `${String(word.word).trim().toLowerCase()}__${String(word.mean).trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function getDeviceProfile(width) {
  if (width >= 1200) {
    return { laneCount: 6, dropCount: 8, speedMin: 88, speedMax: 136, fontScale: 1, wordWidth: 150 };
  }

  if (width >= 768) {
    return { laneCount: 5, dropCount: 7, speedMin: 80, speedMax: 124, fontScale: 0.95, wordWidth: 140 };
  }

  return { laneCount: 4, dropCount: 6, speedMin: 68, speedMax: 108, fontScale: 0.9, wordWidth: 132 };
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function VocabularyRainExperience({
  topicLang = 'en',
  words = [],
  topicTitle = '',
  sourceTitle = '',
  onExit,
  onBackToTopic,
  onSessionComplete,
}) {
  const playableWords = useMemo(() => dedupeWords(words), [words]);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  const [boardHeight, setBoardHeight] = useState(540);
  const [status, setStatus] = useState('ready');
  const [boardDrops, setBoardDrops] = useState([]);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [roundNo, setRoundNo] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const boardRef = useRef(null);
  const animationRef = useRef(null);
  const lastTickRef = useRef(0);
  const dropsRef = useRef([]);
  const deckRef = useRef([]);
  const deckIndexRef = useRef(0);
  const nextRoundTimerRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const gameStartedAtRef = useRef(0);
  const roundLockedRef = useRef(false);
  const sessionNotifiedRef = useRef(false);
  const wrongCountRef = useRef(0);

  const targetRounds = useMemo(() => {
    if (playableWords.length < MIN_PLAYABLE_WORDS) return 0;
    return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, playableWords.length));
  }, [playableWords.length]);

  const deviceProfile = useMemo(() => getDeviceProfile(viewportWidth), [viewportWidth]);
  const speechLang = useMemo(() => getSpeechLang(topicLang), [topicLang]);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => {
      if (boardRef.current) {
        setBoardHeight(boardRef.current.getBoundingClientRect().height || 540);
      }
    });

    if (boardRef.current) {
      observer.observe(boardRef.current);
      setBoardHeight(boardRef.current.getBoundingClientRect().height || 540);
    }

    return () => observer.disconnect();
  }, []);

  const clearFeedback = () => {
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  };

  const clearNextRoundTimer = () => {
    if (nextRoundTimerRef.current) {
      window.clearTimeout(nextRoundTimerRef.current);
      nextRoundTimerRef.current = null;
    }
  };

  const syncDrops = (nextDrops) => {
    dropsRef.current = nextDrops;
    setBoardDrops(nextDrops);
  };

  const beginGame = () => {
    if (!playableWords.length) return;
    setStatus('playing');
  };

  const finishSession = (nextResult) => {
    if (sessionNotifiedRef.current) return;
    sessionNotifiedRef.current = true;
    const elapsed = typeof nextResult.elapsed === 'number'
      ? nextResult.elapsed
      : (gameStartedAtRef.current ? performance.now() - gameStartedAtRef.current : 0);
    setResult({ ...nextResult, elapsed });
    setStatus(nextResult.status);
    clearFeedback();
    clearNextRoundTimer();
    roundLockedRef.current = true;
    syncDrops([]);
    onSessionComplete?.();
  };

  const startRound = () => {
    if (status !== 'playing' || roundLockedRef.current) return;
    clearFeedback();
    clearNextRoundTimer();

    if (!deckRef.current.length) {
      deckRef.current = shuffle(playableWords);
      deckIndexRef.current = 0;
    }

    if (deckIndexRef.current >= deckRef.current.length) {
      deckRef.current = shuffle(playableWords);
      deckIndexRef.current = 0;
    }

    const target = deckRef.current[deckIndexRef.current];
    deckIndexRef.current += 1;
    if (!target) {
      finishSession({
        status: 'result',
        title: 'Mưa từ vựng đã hoàn thành',
        reason: 'completed',
      });
      return;
    }

    const distractors = shuffle(playableWords.filter((word) => word.id !== target.id)).slice(0, Math.max(0, deviceProfile.dropCount - 1));
    const spawnItems = shuffle([target, ...distractors]).slice(0, deviceProfile.dropCount);
    const laneOrder = shuffle(Array.from({ length: deviceProfile.laneCount }, (_, index) => index));
    const heightOffset = Math.max(90, Math.min(boardHeight * 0.18, 160));

    const nextDrops = spawnItems.map((word, index) => {
      const lane = laneOrder[index % laneOrder.length] ?? 0;
      const left = ((lane + 0.5) / deviceProfile.laneCount) * 100;
      const isCorrect = word.id === target.id;
      const drift = (Math.random() - 0.5) * 18;

      return {
        key: `${target.id}-${word.id}-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        word,
        isCorrect,
        x: left,
        y: -heightOffset - (index * 56),
        speed: deviceProfile.speedMin + Math.random() * (deviceProfile.speedMax - deviceProfile.speedMin),
        drift,
      };
    });

    roundLockedRef.current = false;
    gameStartedAtRef.current = gameStartedAtRef.current || performance.now();
    setRoundNo((prev) => prev + 1);
    setCurrentTarget(target);
    setFeedback({
      tone: 'info',
      text: `Tìm từ có nghĩa: ${target.mean}`,
    });
    syncDrops(nextDrops);
  };

  const scheduleNextRound = () => {
    clearNextRoundTimer();
    nextRoundTimerRef.current = window.setTimeout(() => {
      if (deckIndexRef.current >= targetRounds) {
        finishSession({
          status: 'result',
          title: 'Hoàn thành Mưa từ vựng',
          reason: 'completed',
        });
        return;
      }

      roundLockedRef.current = false;
      startRound();
    }, 450);
  };

  const handleCorrect = () => {
    if (status !== 'playing' || roundLockedRef.current || !currentTarget) return;

    const nextStreak = streak + 1;
    const bonus = 10 + Math.min(10, nextStreak * 2);
    const elapsed = performance.now() - gameStartedAtRef.current;

    roundLockedRef.current = true;
    playCorrectSound();
    setScore((prev) => prev + bonus);
    setCorrectCount((prev) => prev + 1);
    setBestStreak((prev) => Math.max(prev, nextStreak));
    setStreak(nextStreak);
    setFeedback({
      tone: 'success',
      text: `Đúng rồi! +${bonus} điểm`,
    });
    syncDrops([]);

    if (correctCount + 1 >= targetRounds) {
      finishSession({
        status: 'result',
        title: 'Hoàn thành Mưa từ vựng',
        reason: 'completed',
        elapsed,
      });
      return;
    }

    clearFeedback();
    feedbackTimerRef.current = window.setTimeout(() => {
      roundLockedRef.current = false;
      scheduleNextRound();
    }, 420);
  };

  const handleDropClick = (drop) => {
    if (status !== 'playing' || roundLockedRef.current) return;

    if (drop.isCorrect) {
      handleCorrect();
      return;
    }

    playIncorrectSound();
    setFeedback({
      tone: 'warn',
      text: `Sai rồi: ${drop.word.mean}`,
    });
    const nextWrongCount = wrongCountRef.current + 1;
    wrongCountRef.current = nextWrongCount;
    setWrongCount(nextWrongCount);
    setStreak(0);
    syncDrops(dropsRef.current.filter((item) => item.key !== drop.key));

    if (nextWrongCount >= START_LIVES) {
      finishSession({
        status: 'gameover',
        title: 'Game over',
        reason: 'wrong-click',
      });
    }
  };

  const handleRestart = () => {
    clearFeedback();
    clearNextRoundTimer();
    setStatus('ready');
    setBoardDrops([]);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    wrongCountRef.current = 0;
    setStreak(0);
    setBestStreak(0);
    setRoundNo(0);
    setCurrentTarget(null);
    setFeedback(null);
    setResult(null);
    gameStartedAtRef.current = 0;
    roundLockedRef.current = false;
    sessionNotifiedRef.current = false;
    deckRef.current = shuffle(playableWords);
    deckIndexRef.current = 0;
    syncDrops([]);
  };

  useEffect(() => {
    if (status !== 'playing' || !playableWords.length || targetRounds < MIN_PLAYABLE_WORDS) {
      return undefined;
    }

    deckRef.current = shuffle(playableWords);
    deckIndexRef.current = 0;
    roundLockedRef.current = false;
    sessionNotifiedRef.current = false;
    gameStartedAtRef.current = 0;
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    wrongCountRef.current = 0;
    setStreak(0);
    setBestStreak(0);
    setRoundNo(0);
    setCurrentTarget(null);
    setFeedback(null);
    setResult(null);
    syncDrops([]);

    const startTimer = window.setTimeout(() => {
      startRound();
    }, 120);

    return () => {
      window.clearTimeout(startTimer);
    };
  }, [playableWords, targetRounds, status]);

  useEffect(() => {
    if (status !== 'playing' || !boardHeight) return undefined;

    const tick = (now) => {
      if (!lastTickRef.current) {
        lastTickRef.current = now;
      }

      const dt = Math.min(0.032, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      const prevDrops = dropsRef.current;
      if (!prevDrops.length) {
        animationRef.current = window.requestAnimationFrame(tick);
        return;
      }

      let missedCorrect = null;
      const nextDrops = [];

      for (const drop of prevDrops) {
        const nextY = drop.y + (drop.speed * dt);
        if (nextY > boardHeight + 110) {
          if (drop.isCorrect && !roundLockedRef.current) {
            missedCorrect = drop.word;
          }
          continue;
        }

        nextDrops.push({
          ...drop,
          y: nextY,
          x: drop.x + (drop.drift * dt * 0.18),
        });
      }

      if (missedCorrect && !roundLockedRef.current) {
        roundLockedRef.current = true;
        syncDrops([]);
        playIncorrectSound();
        const nextWrongCount = wrongCountRef.current + 1;
        wrongCountRef.current = nextWrongCount;
        const isGameOver = nextWrongCount >= START_LIVES;

        setWrongCount(nextWrongCount);
        setStreak(0);
        setFeedback({
          tone: isGameOver ? 'danger' : 'warn',
          text: `Bỏ lỡ từ đúng: ${missedCorrect.word}`,
        });

        if (isGameOver) {
          finishSession({
            status: 'gameover',
            title: 'Game over',
            reason: 'missed',
          });
          animationRef.current = window.requestAnimationFrame(tick);
          return;
        }

        clearFeedback();
        feedbackTimerRef.current = window.setTimeout(() => {
          if (roundLockedRef.current) return;
          roundLockedRef.current = false;
          syncDrops([]);
          if (deckIndexRef.current >= targetRounds) {
            finishSession({
              status: 'result',
              title: 'Hoàn thành Mưa từ vựng',
              reason: 'completed',
            });
            return;
          }
          startRound();
        }, 500);
        animationRef.current = window.requestAnimationFrame(tick);
        return;
      }

      syncDrops(nextDrops);
      animationRef.current = window.requestAnimationFrame(tick);
    };

    animationRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = null;
      lastTickRef.current = 0;
    };
  }, [boardHeight, status]);

  useEffect(() => () => {
    clearFeedback();
    clearNextRoundTimer();
    if (animationRef.current) {
      window.cancelAnimationFrame(animationRef.current);
    }
  }, []);

  if (!playableWords.length || targetRounds < MIN_PLAYABLE_WORDS) {
    return (
      <section className="rain-game-shell">
        <div className="rain-empty-state">
          <span className="rain-empty-icon">🌧️</span>
          <h3>Chưa đủ từ để chơi Mưa từ vựng</h3>
          <p>Hãy chọn topic hoặc tài liệu có ít nhất 2 từ để bắt đầu.</p>
          <button type="button" className="btn btn-secondary" onClick={onBackToTopic || onExit}>
            Quay lại
          </button>
        </div>
      </section>
    );
  }

  if (status === 'ready') {
    return (
      <section className="rain-game-shell rain-game-shell--ready">
        <div className="rain-ready-topbar">
          <button type="button" className="rain-back-btn" onClick={onBackToTopic || onExit}>
            <span aria-hidden="true">←</span>
            <span>Quay lại</span>
          </button>
          <div className="rain-ready-brand">SkyWords</div>
          <div className="rain-ready-spacer" />
        </div>

        <div className="rain-ready-card">
          <div className="rain-ready-avatar" aria-hidden="true">
            <span>🌦️</span>
          </div>
          <div className="rain-ready-badge">Chủ đề đã chọn</div>
          <h2>{topicTitle || 'Mưa từ vựng'}</h2>
          <p className="rain-ready-subtitle">{sourceTitle || 'Chọn từ đúng với nghĩa đang hiển thị bên dưới.'}</p>

          <div className="rain-ready-illustration">
            <span className="rain-ready-cloud" aria-hidden="true">☁️</span>
            <span className="rain-ready-rocket" aria-hidden="true">🚀</span>
            <span className="rain-ready-cloud is-second" aria-hidden="true">☁️</span>
          </div>

          <div className="rain-ready-instructions">
            <div className="rain-ready-note">Chọn từ đang rơi khớp với nghĩa bên dưới.</div>
            <div className="rain-ready-warning">Sai 3 lần là game over.</div>
          </div>

          <button type="button" className="btn btn-primary rain-ready-start" onClick={beginGame}>
            Bắt đầu
          </button>
        </div>
      </section>
    );
  }

  const resultPayload = result || (status === 'playing' ? null : {
    status,
    title: status === 'gameover' ? 'Game over' : 'Hoàn thành Mưa từ vựng',
    reason: status,
  });

  if (resultPayload && status !== 'playing') {
    const elapsedMs = result?.elapsed || 0;

    return (
      <section className="rain-game-shell rain-game-shell--result">
        <div className="rain-result-card">
          <div className="rain-result-brand">
            <span className={`rain-result-icon ${resultPayload.status === 'gameover' ? 'is-danger' : 'is-success'}`}>
              {resultPayload.status === 'gameover' ? '⚠️' : '☀️'}
            </span>
            <strong>{resultPayload.status === 'gameover' ? 'Mưa đã dừng' : 'SkyWords'}</strong>
          </div>
          <h2>{resultPayload.status === 'gameover' ? 'Ôi, mưa đã tạnh sớm' : 'Trời đã hửng nắng!'}</h2>
          <p className="rain-result-copy">
            {resultPayload.status === 'gameover'
              ? 'Bạn đã sai quá 3 lần. Thử lại để phản xạ nhanh hơn nhé.'
              : 'Bạn đã vượt qua cơn mưa từ vựng với một lượt chơi rất đẹp.'}
          </p>
          <div className="rain-result-score">
            <span>Tổng điểm</span>
            <strong>{score}</strong>
          </div>
          <div className="rain-result-grid">
            <div className="rain-result-stat">
              <span>Đúng</span>
              <strong>{correctCount}</strong>
            </div>
            <div className="rain-result-stat">
              <span>Sai</span>
              <strong>{wrongCount}</strong>
            </div>
            <div className="rain-result-stat">
              <span>Streak cao nhất</span>
              <strong>{bestStreak}</strong>
            </div>
            <div className="rain-result-stat">
              <span>Thời gian</span>
              <strong>{formatTime(elapsedMs)}</strong>
            </div>
          </div>
          <div className="rain-result-quote">“Mỗi lần đúng là một từ vựng bám lại lâu hơn.”</div>
          <div className="rain-result-actions">
            <button type="button" className="btn btn-primary" onClick={handleRestart}>
              Chơi lại
            </button>
            <button type="button" className="btn btn-secondary" onClick={onBackToTopic || onExit}>
              Chọn topic khác
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rain-game-shell">
      <div className="rain-game-topbar">
        <button type="button" className="rain-back-btn" onClick={onBackToTopic || onExit}>
          <span aria-hidden="true">←</span>
          <span>Quay lại</span>
        </button>
        <div className="rain-game-context">
          <span className="rain-game-kicker">SkyWords</span>
          <h2>{topicTitle || 'Đang luyện tập'}</h2>
          <p>
            {sourceTitle ? `Nguồn: ${sourceTitle}` : 'Chọn từ rơi đúng với nghĩa đang hiển thị'}
            {' · '}
            {speechLang}
          </p>
        </div>
        <div className="rain-game-hud">
          <div className="rain-hud-chip">
            <span>Điểm</span>
            <strong>{score}</strong>
          </div>
          <div className="rain-hud-chip">
            <span>Đúng</span>
            <strong>{correctCount}/{targetRounds}</strong>
          </div>
          <div className="rain-hud-chip is-danger">
            <span>Sai</span>
            <strong>{wrongCount}/{START_LIVES}</strong>
          </div>
        </div>
      </div>

      <div className="rain-game-board-wrap">
        <div className="rain-game-board" ref={boardRef}>
          <div className="rain-sky-gradient" />
          <div className="rain-rainfall" />
          <div className="rain-cloud rain-cloud-a" />
          <div className="rain-cloud rain-cloud-b" />
          <div className="rain-cloud rain-cloud-c" />
          <div className="rain-streaks" />

          {boardDrops.map((drop) => (
            <button
              key={drop.key}
              type="button"
              className={`rain-drop${drop.isCorrect ? ' is-correct' : ''}`}
              style={{
                left: `${drop.x}%`,
                top: `${drop.y}px`,
                transform: `translate(-50%, -50%) scale(${deviceProfile.fontScale})`,
                minWidth: `${deviceProfile.wordWidth}px`,
              }}
              onClick={() => handleDropClick(drop)}
            >
              <strong>{drop.word.word}</strong>
              <span>{drop.word.transcription || drop.word.wordtype || 'vocabulary'}</span>
            </button>
          ))}

          <div className="rain-bottom-glow" />
        </div>

        <div className={`rain-target-panel ${feedback?.tone ? `is-${feedback.tone}` : ''}`}>
          <div className="rain-target-head">
            <div>
              <span className="rain-target-kicker">Nghĩa cần tìm</span>
              <strong>{currentTarget?.mean || 'Đang nạp...'}</strong>
            </div>
            <div className="rain-target-meta">
              <span>Vòng {Math.min(roundNo, targetRounds)}/{targetRounds}</span>
              <span>Streak {streak} · Best {bestStreak}</span>
            </div>
          </div>

          <div className="rain-target-body">
            <p>{feedback?.text || 'Chạm vào từ đang rơi đúng với nghĩa phía trên.'}</p>
            <div className="rain-target-mini-card">
              <span className="rain-target-mini-label">Từ đang tìm</span>
              <strong>{currentTarget?.mean || '...'}</strong>
            </div>
          </div>

          <div className="rain-target-footer">
            <button type="button" className="btn btn-secondary" onClick={handleRestart}>
              Chơi lại
            </button>
            <button type="button" className="btn btn-primary" onClick={onBackToTopic || onExit}>
              Chọn topic khác
            </button>
          </div>
        </div>
      </div>

      {feedback ? <div className={`rain-floating-feedback is-${feedback.tone}`}>{feedback.text}</div> : null}
    </section>
  );
}

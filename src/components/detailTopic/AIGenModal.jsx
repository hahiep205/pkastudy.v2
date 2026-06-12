// TẠO LIST TỪ VỰNG HÀNG LOẠI VỚI AI

import { useState } from 'react';
import ToastNotice from '../common/ToastNotice';
import CustomModal from '../customDocs/CustomModal';

const AI_API_URL = import.meta.env.VITE_BEE_AI_API_URL || 'https://platform.beeknoee.com/api/v1/chat/completions';
const AI_BEARER = import.meta.env.VITE_BEE_AI_BEARER || 'sk-bee-9b56ef380e6d34ac104b81462524f6ff3693a8e68066cfe888f42ddddfbf3df6';
const AI_MODEL = import.meta.env.VITE_BEE_AI_MODEL || 'glm-4.5-flash';

const LANG_CONFIG = {
    en: {
        label: 'Anh',
        systemPrompt: `You generate high-quality English vocabulary for Vietnamese learners.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown, no backticks, no explanations.
- Each item must contain exactly these fields: word, transcription, mean, wordtype, example, example_vi.

LANGUAGE RULES:
- "word", "transcription", "wordtype", and "example" MUST be in English.
- "mean" and "example_vi" MUST be in Vietnamese.
- NEVER use Vietnamese in the "example" field.
- NEVER mix languages inside a single field.

MEAN RULE:
- "mean" MUST be a short, clear, and accurate Vietnamese translation.
- Keep it concise (usually 1–5 words).
- Do NOT include explanations, extra context, or full sentences.
- The meaning must match the topic context exactly.

QUALITY RULES:
- Every "word" must be a real, common, modern English word or fixed expression relevant to the topic.
- No duplicates, no invented words, no misspellings.
- Use standard IPA for "transcription".
- "example" must be a short, natural, meaningful, grammatically correct English sentence.
- Avoid unnatural or meaningless sentences.

PREFERENCE:
- Use modern everyday American or international English.`

    },
    ko: {
        label: 'Hàn',
        systemPrompt: `You generate high-quality Korean vocabulary for Vietnamese learners.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown, no backticks, no explanations.
- Each item must contain exactly these fields: word, transcription, mean, wordtype, example, example_vi.

LANGUAGE RULES:
- "word", "transcription", "wordtype", and "example" MUST be in Korean.
- "mean" and "example_vi" MUST be in Vietnamese.
- NEVER use Vietnamese in the "example" field.
- NEVER mix languages inside a single field.

MEAN RULE:
- "mean" MUST be a short, clear, and accurate Vietnamese translation.
- Keep it concise (1–5 words).
- Do NOT include explanations or full sentences.
- Must match the topic context exactly.

QUALITY RULES:
- Use natural modern Korean in Hangul.
- No Hanja unless required.
- No malformed spacing, particles, or grammar.
- "example" must be a short, natural, correct Korean sentence.`
    },
    ja: {
        label: 'Nhật',
        systemPrompt: `You generate high-quality Japanese vocabulary for Vietnamese learners.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown, no backticks, no explanations.
- Each item must contain exactly these fields: word, transcription, mean, wordtype, example, example_vi.

LANGUAGE RULES:
- "word", "transcription", "wordtype", and "example" MUST be in Japanese.
- "mean" and "example_vi" MUST be in Vietnamese.
- NEVER use Vietnamese in the "example" field.
- NEVER mix languages inside a single field.

MEAN RULE:
- "mean" MUST be a short, clear, and accurate Vietnamese translation.
- Keep it concise (1–5 words).
- No explanations or full sentences.
- Must match the topic context.

QUALITY RULES:
- Use natural modern Japanese with correct kanji and kana.
- Use dictionary form for verbs/adjectives.
- "example" must be a short, natural, correct Japanese sentence.`
    },
    zh: {
        label: 'Trung',
        systemPrompt: `You generate high-quality Mandarin Chinese vocabulary for Vietnamese learners.

=====================
STRICT OUTPUT FORMAT
=====================
- Return ONLY a valid JSON array.
- DO NOT include markdown, backticks, comments, explanations, or any text outside JSON.
- Output MUST start with "[" and end with "]".
- Use ONLY double quotes (") for all keys and string values.
- DO NOT use single quotes.
- DO NOT include trailing commas.
- Ensure the output can be parsed by JSON.parse().

=====================
STRUCTURE (MANDATORY)
=====================
Each item MUST contain EXACTLY these 6 fields:
- "word"
- "transcription"
- "mean"
- "wordtype"
- "example"
- "example_vi"

No extra fields. No missing fields.

=====================
LANGUAGE RULES
=====================
- "word" and "example" MUST be in Simplified Chinese.
- "transcription" MUST be standard pinyin WITH tone marks (e.g., nǐ hǎo).
- Each pinyin syllable MUST be separated by a space.
- "mean" and "example_vi" MUST be in Vietnamese.
- NEVER mix languages within a single field.

=====================
WORD RULES
=====================
- "word" MUST be a real, common, modern Mandarin word.
- Prefer SHORT words:
  + 1–2 Chinese characters OR short compounds (max 2 words)
- DO NOT use long phrases or sentences.
- DO NOT use rare, archaic, or invented words.
- NO duplicates.

HARD CONSTRAINT:
- If "word" is not a real word → INVALID
- If "word" is too long → INVALID

=====================
PINYIN VALIDATION (CRITICAL)
=====================
- "transcription" MUST match exactly the pronunciation of "word".
- MUST be valid real Mandarin pinyin syllables.
- MUST include tone marks.
- MUST separate syllables by spaces.

FORBIDDEN:
- Fake syllables (e.g., shuàn, jiàoàn if invalid)
- Long concatenated strings without spaces
- Repeated meaningless syllables

HARD CONSTRAINT:
- If pinyin is invalid → INVALID

=====================
SEMANTIC ALIGNMENT (CRITICAL)
=====================
- "word", "transcription", and "mean" MUST represent the SAME meaning.
- "transcription" must correctly reflect how "word" is pronounced.
- "mean" must be the correct Vietnamese meaning.

FORBIDDEN:
- Random combinations
- Unrelated meanings
- Fake mappings

HARD CONSTRAINT:
- If fields do not match semantically → INVALID

=====================
SEMANTIC UNIQUENESS
=====================
- Each "word" must represent a DISTINCT concept.

FORBIDDEN:
- Same base word + minor variation
- Opposite pairs (good/bad, big/small)
- Same structure with 1 word changed

HARD CONSTRAINT:
- If two entries are similar in structure and meaning → INVALID

=====================
ANTI-REPETITION (CRITICAL)
=====================
- DO NOT repeat words inside any field.

FORBIDDEN:
- "trình bày trình bày trình bày"
- "shu shu shu"
- Any repeated sequence

HARD CONSTRAINT:
- If repetition occurs → INVALID

=====================
MEAN RULE (VERY IMPORTANT)
=====================
- "mean" MUST be Vietnamese.
- Short and precise: 1–4 words ONLY.
- NO explanations.
- NO full sentences.
- Must match topic context.

HARD CONSTRAINT:
- If "mean" > 4 words → INVALID

=====================
WORDTYPE
=====================
- Must be specific: noun, verb, adjective, adverb, phrase...
- NO vague labels.

=====================
EXAMPLE RULE
=====================
- "example" MUST be:
  + A short, natural, grammatically correct Chinese sentence
  + Length: 5–15 Chinese characters
  + Clear meaning, no nonsense

HARD CONSTRAINT:
- If not valid Chinese → INVALID

=====================
TRANSLATION RULE
=====================
- "example_vi" MUST be:
  + Vietnamese
  + Accurate translation of "example"

=====================
STRICT PROHIBITIONS
=====================
- NO duplicate words
- NO invented words
- NO meaningless outputs
- NO malformed pinyin
- NO mixing languages
- NO invalid JSON
- NO extra text outside JSON

=====================
SELF-CHECK (MANDATORY)
=====================
Before output:
- Validate JSON syntax
- Validate all fields exist
- Validate pinyin correctness
- Validate no repetition
- Validate semantic correctness
- Validate all constraints above

If ANY rule is violated → regenerate internally until valid.

OUTPUT ONLY JSON.`
    },
    fr: {
        label: 'Pháp',
        systemPrompt: `You generate high-quality French vocabulary for Vietnamese learners.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown, no backticks, no explanations.
- Each item must contain exactly these fields: word, transcription, mean, wordtype, example, example_vi.

LANGUAGE RULES:
- "word", "transcription", "wordtype", and "example" MUST be in French.
- "mean" and "example_vi" MUST be in Vietnamese.
- NEVER use Vietnamese in the "example" field.
- NEVER mix languages inside a single field.

MEAN RULE:
- "mean" MUST be a short, clear, and accurate Vietnamese translation.
- Keep it concise (1–5 words).
- No explanations or full sentences.
- Must match the topic context.

QUALITY RULES:
- Use modern standard French with correct accents.
- Use infinitive form for verbs.
- "example" must be a short, natural, correct French sentence.`
    }
};

const REQUIRED_FIELDS = ['word', 'transcription', 'mean', 'wordtype', 'example', 'example_vi'];
const DEFAULT_LANG = LANG_CONFIG.en;

function buildUserPrompt({ count, label, langName, theme }) {
    return `Tạo ${count} từ vựng tiếng ${label} về chủ đề "${theme}".

YÊU CẦU BẮT BUỘC (PHẢI TUÂN THỦ 100%):
- Trả về CHỈ một JSON array hợp lệ.
- KHÔNG markdown, KHÔNG backtick, KHÔNG giải thích, KHÔNG text ngoài JSON.
- Nếu sai format → output bị coi là INVALID.

CẤU TRÚC DỮ LIỆU:
- Mỗi phần tử là object có ĐÚNG 6 trường:
  word, transcription, mean, wordtype, example, example_vi
- KHÔNG thêm field
- KHÔNG thiếu field

QUY TẮC TỪ VỰNG:
- "word" phải là từ/cụm từ CÓ THẬT, phổ biến, hiện đại
- Liên quan TRỰC TIẾP đến chủ đề "${theme}"
- KHÔNG trùng lặp
- KHÔNG từ sai chính tả, KHÔNG từ bịa, KHÔNG từ hiếm

ĐỘ DÀI "word":
- Ưu tiên từ đơn (single word)
- Nếu là cụm từ → tối đa 2 từ
- Tổng độ dài không vượt quá 15 ký tự
- KHÔNG phrase dài, KHÔNG câu

HARD CONSTRAINT:
- Nếu "word" > 2 từ → INVALID
- Nếu "word" > 15 ký tự → INVALID

PHIÊN ÂM:
- "transcription" phải là IPA hoặc phiên âm chuẩn
- KHÔNG để trống
- KHÔNG sai chuẩn

NGHĨA (RẤT QUAN TRỌNG):
- "mean" phải là tiếng Việt
- Ngắn gọn (1–4 từ), rõ ràng, chính xác
- Đúng ngữ nghĩa theo chủ đề "${theme}"
- KHÔNG viết thành câu
- KHÔNG giải thích, KHÔNG diễn giải dài dòng
- KHÔNG mơ hồ

HARD CONSTRAINT:
- Nếu "mean" > 4 từ → INVALID

TỪ LOẠI:
- "wordtype" phải rõ ràng: noun, verb, adjective, adverb, phrase...
- KHÔNG viết chung chung

CÂU VÍ DỤ:
- "example" phải:
  + Là câu NGẮN (5–15 từ)
  + Tự nhiên, đúng ngữ pháp
  + VIẾT BẰNG ${langName}
  + KHÔNG dùng tiếng Việt
  + Có ý nghĩa rõ ràng

HARD CONSTRAINT:
- Nếu "example" không phải ${langName} → INVALID

DỊCH CÂU:
- "example_vi" phải:
  + Là tiếng Việt
  + Dịch ĐÚNG NGHĨA câu example
  + Không sai ngữ cảnh

CẤM TUYỆT ĐỐI:
- KHÔNG trộn ngôn ngữ trong cùng field
- KHÔNG câu vô nghĩa
- KHÔNG từ vô nghĩa
- KHÔNG lặp từ
- KHÔNG nội dung ngoài JSON

KIỂM TRA CUỐI:
- Nếu bất kỳ field nào sai → toàn bộ output là INVALID

MẪU:
[{"word":"...","transcription":"...","mean":"...","wordtype":"...","example":"...","example_vi":"..."}]`;
}

function stripCodeFence(text) {
    return String(text || '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
}

function extractJsonArray(text) {
    const cleaned = stripCodeFence(text);
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) {
        throw new Error('Dữ liệu trả về không chứa JSON array hợp lệ');
    }
    return cleaned.slice(start, end + 1);
}

function cleanText(value) {
    return String(value ?? '')
        .replace(/\s+/g, ' ')
        .replace(/^[\s"'`]+|[\s"'`]+$/g, '')
        .trim();
}

function isMeaningfulSentence(value) {
    const sentence = cleanText(value);
    if (!sentence || sentence.length < 4) return false;

    const compact = sentence.replace(/[^\p{L}\p{N}]+/gu, '');
    if (compact.length < 3) return false;
    if (!/[\p{L}\p{N}]/u.test(sentence)) return false;

    return !/^(test|example|sample|n\/a|null|undefined)$/i.test(sentence);
}

function normalizeWordItem(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;

    const normalized = REQUIRED_FIELDS.reduce((acc, field) => {
        acc[field] = cleanText(item[field]);
        return acc;
    }, {});

    if (REQUIRED_FIELDS.some((field) => !normalized[field])) return null;
    if (!isMeaningfulSentence(normalized.example) || !isMeaningfulSentence(normalized.example_vi)) return null;
    if (normalized.word.length < 1 || normalized.mean.length < 1 || normalized.wordtype.length < 2) return null;

    return normalized;
}

function getShortWordType(value = '') {
    const normalized = cleanText(value).toLowerCase();

    if (!normalized) return '';
    if (normalized === 'n' || normalized.includes('noun')) return 'n';
    if (normalized === 'v' || normalized.includes('verb')) return 'v';
    if (normalized === 'adj' || normalized.includes('adjective')) return 'adj';
    if (normalized === 'adv' || normalized.includes('adverb')) return 'adv';
    if (normalized === 'prep' || normalized.includes('preposition')) return 'prep';
    if (normalized === 'pron' || normalized.includes('pronoun')) return 'pron';
    if (normalized === 'conj' || normalized.includes('conjunction')) return 'conj';
    if (normalized === 'interj' || normalized.includes('interjection')) return 'interj';
    if (normalized === 'phrase' || normalized.includes('phrase')) return 'phr';

    return normalized.slice(0, 6);
}

function parseGeneratedWords(rawText, requestedCount) {
    const parsed = JSON.parse(extractJsonArray(rawText));
    if (!Array.isArray(parsed)) {
        throw new Error('AI không trả về danh sách hợp lệ');
    }

    const seen = new Set();
    const normalized = parsed
        .map(normalizeWordItem)
        .filter(Boolean)
        .filter((item) => {
            const key = `${item.word.toLowerCase()}__${item.mean.toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, requestedCount);

    if (normalized.length === 0) {
        throw new Error('AI trả về dữ liệu nhưng không có từ vựng hợp lệ để sử dụng');
    }

    if (normalized.length < Math.max(3, Math.ceil(requestedCount / 2))) {
        throw new Error('AI trả về quá ít mục hợp lệ. Hay thử tạo lại để lấy bộ từ chất lượng hơn');
    }

    return normalized;
}

async function buildAiError(resp) {
    let detail = '';

    try {
        const data = await resp.json();
        detail =
            data?.error?.message ||
            data?.error?.details ||
            data?.message ||
            data?.detail ||
            '';
    } catch {
        detail = '';
    }

    if (resp.status === 429) {
        return 'AI đang bận hoặc đã chạm giới hạn tạm thời. Vui lòng đợi 30-60 giây rồi thử lại.';
    }

    if (resp.status === 401 || resp.status === 403) {
        return 'Cấu hình AI hiện tại không hợp lệ hoặc đã hết quyền truy cập.';
    }

    if (resp.status >= 500) {
        return 'Máy chủ AI đang gặp sự cố tạm thời. Vui lòng thử lại sau ít phút.';
    }

    return detail || `HTTP ${resp.status}`;
}

export default function AIGenModal({ isOpen, onClose, onSave, topicLang }) {
    const [theme, setTheme] = useState('');
    const [count, setCount] = useState(3);
    const [status, setStatus] = useState('input');
    const [errorMsg, setErrorMsg] = useState('');
    const [previewWords, setPreviewWords] = useState([]);
    const [selectedIndexes, setSelectedIndexes] = useState(new Set());
    const [toastMessage, setToastMessage] = useState('');

    const currentLang = LANG_CONFIG[topicLang] || DEFAULT_LANG;
    const langLabel = currentLang.label;

    const handleGenerate = async () => {
        if (status === 'loading') return;

        if (!theme.trim()) {
            setToastMessage('Vui lòng nhập chủ đề');
            return;
        }

        setErrorMsg('');
        setStatus('loading');

        try {
            const prompt = buildUserPrompt({ count, label: langLabel, theme: theme.trim() });

            const resp = await fetch(AI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${AI_BEARER}`
                },
                body: JSON.stringify({
                    model: AI_MODEL,
                    messages: [
                        { role: 'system', content: currentLang.systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 3000,
                    temperature: 0.2,
                    stream: false
                })
            });

            if (!resp.ok) {
                throw new Error(await buildAiError(resp));
            }

            const data = await resp.json();
            const text = data.choices?.[0]?.message?.content || '';
            const words = parseGeneratedWords(text, count);

            setPreviewWords(words);
            setSelectedIndexes(new Set(words.map((_, index) => index)));
            setStatus('preview');
        } catch (err) {
            setErrorMsg(err.message || 'Có lỗi xảy ra khi tạo từ vựng');
            setStatus('error');
        }
    };

    const handleToggleCheck = (idx) => {
        const newSet = new Set(selectedIndexes);
        if (newSet.has(idx)) newSet.delete(idx);
        else newSet.add(idx);
        setSelectedIndexes(newSet);
    };

    const handleToggleAll = () => {
        if (selectedIndexes.size === previewWords.length) setSelectedIndexes(new Set());
        else setSelectedIndexes(new Set(previewWords.map((_, index) => index)));
    };

    const handleSaveWords = () => {
        const selected = Array.from(selectedIndexes).map((idx) => previewWords[idx]);
        if (selected.length === 0) {
            setToastMessage('Vui lòng chọn ít nhất 1 từ');
            return;
        }

        onSave(selected);
        handleReset();
        onClose();
    };

    const handleReset = () => {
        setStatus('input');
        setTheme('');
        setErrorMsg('');
        setPreviewWords([]);
        setSelectedIndexes(new Set());
        setToastMessage('');
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={() => {
                handleReset();
                onClose();
            }}
            boxClassName="cv-ai-modal-box"
            title="AI tạo từ vựng hàng loạt"
        >
            <ToastNotice message={toastMessage} onHide={() => setToastMessage('')} />
            {status === 'input' && (
                <>
                    <div className="cv-modal-body" id="cv-ai-modal-body">
                        <div className="cv-ai-intro">
                            <p>Mô tả chủ đề bạn muốn học. AI sẽ tạo danh sách từ vựng kèm phiên âm, nghĩa và câu ví dụ.</p>
                        </div>
                        <div className="cv-form-row">
                            <div className="cv-form-group" style={{ flex: 2 }}>
                                <label className="cv-form-label">
                                    Chủ đề / Mô tả <span style={{ color: 'var(--red)' }}>*</span>
                                </label>
                                <input
                                    className="cv-form-input"
                                    placeholder="Ví dụ: từ vựng văn phòng, du lịch..."
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                />
                            </div>
                            <div className="cv-form-group" style={{ flex: 1 }}>
                                <label className="cv-form-label">Ngôn ngữ</label>
                                <div
                                    className="cv-form-input"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'var(--bg-page)',
                                        cursor: 'default',
                                        color: 'var(--gray-text)'
                                    }}
                                >
                                    <span>Tiếng {langLabel}</span>
                                </div>
                            </div>
                            <div className="cv-form-group" style={{ flex: 1 }}>
                                <label className="cv-form-label">Số từ</label>
                                <select
                                    className="cv-form-input cv-form-select"
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                >
                                    <option value="1">1 từ</option>
                                    <option value="3">3 từ</option>
                                    <option value="5">5 từ</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="cv-modal-footer cv-modal-footer-split">
                        <button className="btn btn-secondary" onClick={onClose}>Hủy</button>
                        <button className="cv-btn-ai cv-btn-ai-large" onClick={handleGenerate}>Tạo từ vựng</button>
                    </div>
                </>
            )}

            {status === 'loading' && (
                <div className="cv-modal-body">
                    <div className="cv-ai-loading">
                        <div className="cv-ai-spinner"></div>
                        <p>
                            AI đang tạo <strong>{count} từ vựng tiếng {langLabel}</strong>
                            <br />
                            về "<em>{theme}</em>"...
                        </p>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="cv-modal-body">
                    <div className="cv-ai-error">
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>?</div>
                        <p>
                            Có lỗi xảy ra khi gọi AI.
                            <br />
                            <small style={{ color: 'var(--gray-light)' }}>{errorMsg}</small>
                        </p>
                        <button className="btn btn-primary" onClick={() => setStatus('input')}>Thử lại</button>
                    </div>
                </div>
            )}

            {status === 'preview' && (
                <>
                    <div className="cv-modal-body" style={{ padding: '10px' }}>
                        <div className="cv-ai-preview-header">
                            <p>
                                AI tạo được <strong>{previewWords.length} từ vựng tiếng {langLabel}</strong> về "<em>{theme}</em>"
                            </p>
                            <label className="cv-ai-select-all-wrap">
                                <input
                                    type="checkbox"
                                    checked={selectedIndexes.size === previewWords.length}
                                    onChange={handleToggleAll}
                                />
                                <span>Chọn tất cả</span>
                            </label>
                        </div>
                        <div className="cv-ai-preview-table">
                            <div className="cv-ai-preview-head">
                                <span></span>
                                <span>Từ vựng</span>
                                <span>Nghĩa</span>
                                <span>Loại từ</span>
                                <span>Ví dụ</span>
                            </div>
                            {previewWords.map((word, index) => (
                                <div key={index} className="cv-ai-preview-row" onClick={() => handleToggleCheck(index)}>
                                    <div className="cv-ai-preview-check">
                                        <input
                                            type="checkbox"
                                            checked={selectedIndexes.has(index)}
                                            onChange={() => handleToggleCheck(index)}
                                            onClick={(event) => event.stopPropagation()}
                                        />
                                    </div>
                                    <div className="cv-ai-preview-word">
                                        <strong>{word.word}</strong>
                                        <div className="cv-ai-preview-trans">{word.transcription}</div>
                                    </div>
                                    <div className="cv-ai-preview-mean">{word.mean}</div>
                                    <div className="cv-ai-preview-type" data-short={getShortWordType(word.wordtype)}>{word.wordtype}</div>
                                    <div className="cv-ai-preview-example">
                                        <div>{word.example}</div>
                                        <div>{word.example_vi}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="cv-modal-footer">
                        <span className="cv-ai-selected-count">{selectedIndexes.size} từ được chọn</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ flex: 1, width: '100%' }}
                                onClick={() => setStatus('input')}
                            >
                                Tạo lại
                            </button>

                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, width: '100%' }}
                                onClick={handleSaveWords}
                            >
                                Hoàn thành
                            </button>
                        </div>
                    </div>
                </>
            )}
        </CustomModal>
    );
}

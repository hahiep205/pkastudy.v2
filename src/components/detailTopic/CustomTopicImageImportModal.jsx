import { useEffect, useMemo, useRef, useState } from 'react';
import ToastNotice from '../common/ToastNotice';
import CustomModal from '../customDocs/CustomModal';
import { getTopicLanguageMeta } from '../../utils/customTopicAi';

const AI_API_URL = import.meta.env.VITE_BEE_AI_API_URL || 'https://platform.beeknoee.com/api/v1/chat/completions';
const AI_BEARER = import.meta.env.VITE_BEE_AI_BEARER || '';
const AI_MODEL = import.meta.env.VITE_BEE_AI_MODEL || 'openai/gpt-oss-120b';

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeWord(value) {
  return cleanText(value).toLocaleLowerCase();
}

function limitMeaning(value) {
  const parts = cleanText(value).split(/\s+/).filter(Boolean);
  return parts.slice(0, 5).join(' ');
}

function extractJsonPayload(text) {
  const cleaned = String(text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const startArray = cleaned.indexOf('[');
  const endArray = cleaned.lastIndexOf(']');
  if (startArray !== -1 && endArray !== -1 && endArray > startArray) {
    return cleaned.slice(startArray, endArray + 1);
  }

  const startObject = cleaned.indexOf('{');
  const endObject = cleaned.lastIndexOf('}');
  if (startObject === -1 || endObject === -1 || endObject <= startObject) {
    throw new Error('AI không trả về dữ liệu JSON hợp lệ.');
  }

  return cleaned.slice(startObject, endObject + 1);
}

function normalizePreviewItem(item, fallback = {}) {
  const pick = (...values) => values.map(cleanText).find(Boolean) || '';
  const normalized = {
    word: pick(item?.word, item?.headword, item?.term) || cleanText(fallback.word),
    mean: pick(item?.mean, item?.meaning, item?.definition, item?.sense) || cleanText(fallback.mean),
    wordtype: pick(item?.wordtype, item?.word_type, item?.part_of_speech, item?.pos, item?.type) || cleanText(fallback.wordtype),
  };

  if (!normalized.word) return null;
  normalized.mean = limitMeaning(normalized.mean);
  return normalized;
}

function buildImagePrompt(existingWords = [], topicLang = 'en') {
  const languageMeta = getTopicLanguageMeta(topicLang);
  const existingList = existingWords.slice(0, 30).map((word) => cleanText(word?.word)).filter(Boolean).join(', ');

  return `You are reading an image that contains ${languageMeta.scriptHint} vocabulary words.

Return ONLY one valid JSON array.
Do not include markdown, explanations, or extra text.
Return at most 15 items.

Each item must contain exactly these keys:
word, mean, wordtype

Rules:
- Extract only clearly visible ${languageMeta.scriptHint} words or short expressions from the image.
- Keep the same reading order as the image.
- Do not invent words that are not visible.
- Remove duplicates.
- The "mean" field must be a short Vietnamese meaning with no more than 5 words.
- The "wordtype" field should be specific, such as noun, verb, adjective, adverb, phrase.
- If a word already exists in the current topic, prefer a different visible word instead.

Existing words in this topic:
${existingList || '(none)'}`;
}

async function buildAiError(resp) {
  let detail = '';
  try {
    const data = await resp.json();
    detail = data?.error?.message || data?.error?.details || data?.message || data?.detail || '';
  } catch {
    detail = '';
  }

  if (resp.status === 429) {
    return 'AI đang bận hoặc đã chạm giới hạn tạm thời. Vui lòng thử lại sau ít phút.';
  }

  if (resp.status === 401 || resp.status === 403) {
    return 'Cấu hình AI hiện tại không hợp lệ hoặc đã hết quyền truy cập.';
  }

  if (resp.status >= 500) {
    return 'Máy chủ AI đang gặp sự cố tạm thời. Vui lòng thử lại sau.';
  }

  return detail || `HTTP ${resp.status}`;
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không thể đọc file ảnh.'));
    reader.readAsDataURL(file);
  });
}

export default function CustomTopicImageImportModal({ isOpen, onClose, onImport, existingWords = [], topicLang = 'en' }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [status, setStatus] = useState('input');
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [previewWords, setPreviewWords] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState(new Set());

  const existingWordSet = useMemo(() => new Set(existingWords.map((word) => normalizeWord(word?.word)).filter(Boolean)), [existingWords]);

  const resetState = () => {
    setSelectedFile(null);
    setImageDataUrl('');
    setStatus('input');
    setErrorMsg('');
    setToastMessage('');
    setPreviewWords([]);
    setSelectedIndexes(new Set());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn một file ảnh hợp lệ.');
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
    setPreviewWords([]);
    setSelectedIndexes(new Set());
    setStatus('input');

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageDataUrl(dataUrl);
    } catch (error) {
      setErrorMsg(error?.message || 'Không thể xử lý file ảnh này.');
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageDataUrl) {
      setErrorMsg('Vui lòng chọn một file ảnh trước khi phân tích.');
      return;
    }

    setErrorMsg('');
    setStatus('loading');

    try {
      const resp = await fetch(AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_BEARER}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            {
              role: 'system',
              content: `You extract visible ${getTopicLanguageMeta(topicLang).scriptHint} vocabulary from images and return only JSON.`,
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: buildImagePrompt(existingWords, topicLang) },
                { type: 'image_url', image_url: { url: imageDataUrl } },
              ],
            },
          ],
          max_tokens: 1800,
          temperature: 0.1,
          stream: false,
        }),
      });

      if (!resp.ok) {
        throw new Error(await buildAiError(resp));
      }

      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content || '';
      const parsed = JSON.parse(extractJsonPayload(text));
      const parsedList = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.items)
          ? parsed.items
          : Array.isArray(parsed?.words)
            ? parsed.words
            : Array.isArray(parsed?.data)
              ? parsed.data
              : [parsed];

      const seen = new Set();
      const normalizedWords = parsedList
        .map((item) => normalizePreviewItem(item))
        .filter(Boolean)
        .filter((item) => {
          const normalized = normalizeWord(item.word);
          if (!normalized || seen.has(normalized) || existingWordSet.has(normalized)) {
            return false;
          }
          seen.add(normalized);
          return true;
        })
        .slice(0, 15);

      if (normalizedWords.length === 0) {
        throw new Error('AI chưa đọc được từ nào rõ ràng trong ảnh này.');
      }

      setPreviewWords(normalizedWords);
      setSelectedIndexes(new Set(normalizedWords.map((_, index) => index)));
      setStatus('preview');
    } catch (error) {
      setErrorMsg(error?.message || 'Không thể phân tích ảnh lúc này.');
      setStatus('error');
    }
  };

  const handleToggleCheck = (idx) => {
    const nextSet = new Set(selectedIndexes);
    if (nextSet.has(idx)) nextSet.delete(idx);
    else nextSet.add(idx);
    setSelectedIndexes(nextSet);
  };

  const handleToggleAll = () => {
    if (selectedIndexes.size === previewWords.length) {
      setSelectedIndexes(new Set());
      return;
    }

    setSelectedIndexes(new Set(previewWords.map((_, index) => index)));
  };

  const handleAddSelected = async () => {
    const selected = Array.from(selectedIndexes).map((idx) => previewWords[idx]).filter(Boolean);

    if (selected.length === 0) {
      setToastMessage('Vui lòng chọn ít nhất 1 từ.');
      return;
    }

    setStatus('importing');

    try {
      const result = await onImport(selected);
      if (result?.error) {
        throw new Error(result.error);
      }

      resetState();
      onClose();
    } catch (error) {
      setErrorMsg(error?.message || 'Không thể thêm từ từ ảnh lúc này.');
      setStatus('preview');
    }
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      boxClassName="cv-image-import-modal"
      title="Thêm từ hình ảnh"
    >
      <ToastNotice message={toastMessage} onHide={() => setToastMessage('')} />

      {status === 'input' && (
        <>
          <div className="cv-modal-body cv-image-import-body">
            <div className="cv-image-import-copy">
              <p>Tải lên một ảnh có chứa từ tiếng Anh.</p>
              <p>AI sẽ đọc tối đa 15 từ, tạo preview với các cột word, mean và loại từ.</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="cv-image-import-file"
              onChange={handleFileChange}
            />

            <div className="cv-image-import-actions">
              <button type="button" className="cv-excel-import-choice cv-excel-import-choice-primary" onClick={handlePickFile}>
                <span className="cv-excel-import-choice-title">Chọn ảnh</span>
                <span className="cv-excel-import-choice-desc">
                  Chọn file ảnh chứa danh sách từ để AI phân tích.
                </span>
              </button>

              <button
                type="button"
                className="cv-excel-import-choice"
                onClick={handleAnalyzeImage}
                disabled={!imageDataUrl}
              >
                <span className="cv-excel-import-choice-title">Phân tích ảnh</span>
                <span className="cv-excel-import-choice-desc">
                  AI sẽ đọc và tạo preview tối đa 15 từ.
                </span>
              </button>
            </div>

            {selectedFile ? (
              <div className="cv-image-import-selected">
                <strong>Đã chọn:</strong> {selectedFile.name}
              </div>
            ) : null}

            {imageDataUrl ? (
              <div className="cv-image-import-preview">
                <img src={imageDataUrl} alt="Preview" />
              </div>
            ) : null}

            {errorMsg ? <div className="cv-excel-import-error">{errorMsg}</div> : null}
          </div>

          <div className="cv-modal-footer cv-modal-footer-split">
            <button className="btn btn-secondary" onClick={handleClose}>Hủy</button>
            <button className="cv-btn-ai cv-btn-ai-large" onClick={handleAnalyzeImage} disabled={!imageDataUrl}>
              Phân tích ảnh
            </button>
          </div>
        </>
      )}

      {status === 'loading' && (
        <div className="cv-modal-body">
          <div className="cv-ai-loading">
            <div className="cv-ai-spinner"></div>
            <p>AI đang đọc ảnh và nhận diện tối đa 15 từ...</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="cv-modal-body">
          <div className="cv-ai-error">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>?</div>
            <p>
              Cần kiểm tra lại ảnh hoặc thử một ảnh khác.
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
                AI tìm được <strong>{previewWords.length} từ</strong> từ ảnh đã tải lên.
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

            <div className="cv-ai-preview-table cv-image-preview-table">
              <div className="cv-ai-preview-head cv-image-preview-head">
                <span></span>
                <span>Word</span>
                <span>Mean</span>
                <span>Loại từ</span>
              </div>

              {previewWords.map((word, index) => (
                <div key={`${word.word}-${index}`} className="cv-ai-preview-row cv-image-preview-row" onClick={() => handleToggleCheck(index)}>
                  <div className="cv-ai-check-wrap">
                    <label className="cv-ai-check-wrap" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="cv-ai-chk"
                        checked={selectedIndexes.has(index)}
                        onChange={() => handleToggleCheck(index)}
                      />
                      <span className="cv-ai-chk-box"></span>
                    </label>
                  </div>
                  <div className="cv-ai-preview-word">
                    <strong>{word.word}</strong>
                  </div>
                  <div className="cv-ai-preview-mean">{word.mean}</div>
                  <div className="cv-ai-preview-type" data-short={word.wordtype}>{word.wordtype}</div>
                </div>
              ))}
            </div>

            {errorMsg ? <div className="cv-excel-import-error" style={{ marginTop: '12px' }}>{errorMsg}</div> : null}
          </div>

          <div className="cv-modal-footer">
            <span className="cv-ai-selected-count">{selectedIndexes.size} từ được chọn</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1, width: '100%' }} onClick={() => setStatus('input')}>
                Phân tích lại
              </button>
              <button className="btn btn-primary" style={{ flex: 1, width: '100%' }} onClick={handleAddSelected} disabled={status === 'importing'}>
                {status === 'importing' ? 'Đang thêm...' : 'Thêm'}
              </button>
            </div>
          </div>
        </>
      )}

      {status === 'importing' && (
        <div className="cv-modal-body">
          <div className="cv-ai-loading">
            <div className="cv-ai-spinner"></div>
            <p>AI đang bổ sung dữ liệu và thêm các từ đã chọn...</p>
          </div>
        </div>
      )}
    </CustomModal>
  );
}

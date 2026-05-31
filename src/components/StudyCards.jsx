import { useState } from 'react';
import { getCardStudyStatus, setCardStudyStatus } from '../lib/db';

export default function StudyCards({ set }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!set || !set.items || set.items.length === 0) {
    return <div className="empty-state"><div className="icon">📭</div><p>Không có thẻ nào</p></div>;
  }

  const items = set.items;
  const item = items[currentIndex];
  const status = getCardStudyStatus(set.id, currentIndex);

  const goNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const markStatus = (s) => {
    setCardStudyStatus(set.id, currentIndex, s);
    // Force re-render by going to next if available
    if (currentIndex < items.length - 1) {
      goNext();
    } else {
      setFlipped(false);
      // Force re-render
      setCurrentIndex(currentIndex);
    }
  };

  return (
    <div className="flashcard-container">
      <div className="flashcard-progress">
        {currentIndex + 1} / {items.length}
      </div>

      <div className="flashcard-wrapper" onClick={() => setFlipped(!flipped)}>
        <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-face flashcard-front">
            <div className="kanji-text">{item.kanji}</div>
            <div className="flashcard-hint">Chạm để lật</div>
          </div>
          <div className="flashcard-face flashcard-back">
            <div className="definition-text">{item.definition}</div>
          </div>
        </div>
      </div>

      <div className="status-buttons">
        <button
          className={`status-btn learned ${status === 'learned' ? 'active' : ''}`}
          onClick={() => markStatus('learned')}
        >
          ✅ Đã thuộc
        </button>
        <button
          className={`status-btn review ${status === 'review' ? 'active' : ''}`}
          onClick={() => markStatus('review')}
        >
          🔄 Học lại
        </button>
        <button
          className={`status-btn new-card ${status === 'new' ? 'active' : ''}`}
          onClick={() => markStatus('new')}
        >
          🆕 Chưa học
        </button>
      </div>

      <div className="flashcard-nav">
        <button onClick={goPrev} disabled={currentIndex === 0}>← Trước</button>
        <button onClick={goNext} disabled={currentIndex === items.length - 1}>Tiếp →</button>
      </div>
    </div>
  );
}

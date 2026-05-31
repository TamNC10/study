import { getCardStudyStatus } from '../lib/db';

export default function LessonDetail({ set, onStudy, onQuiz }) {
  if (!set || !set.items) return null;

  return (
    <div>
      <div className="action-bar">
        <button className="action-btn study" onClick={onStudy}>📖 Học</button>
        <button className="action-btn quiz" onClick={onQuiz}>✍️ Kiểm tra</button>
      </div>

      <div className="item-list">
        {set.items.map((item, idx) => {
          const status = getCardStudyStatus(set.id, idx);
          return (
            <div key={idx} className={`item-card status-${status}`}>
              <div className="item-card-header">
                <div className="kanji">{item.kanji}</div>
                <span className={`item-status-badge ${status}`}>
                  {status === 'learned' ? '✓' : status === 'review' ? '↻' : '○'}
                </span>
              </div>
              <div className="definition">{item.definition}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

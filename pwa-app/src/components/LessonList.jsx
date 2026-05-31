import { getStudyStatus } from '../lib/db';

export default function LessonList({ sets, onSelectLesson }) {
  if (!sets || sets.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📚</div>
        <p>Không có bài học nào</p>
      </div>
    );
  }

  const studyStatus = getStudyStatus();

  // Calculate stats for each set and sort by word count
  const setsWithStats = sets.map(set => {
    const totalCards = set.totalCards || (set.items ? set.items.length : 0);
    let learned = 0;
    let review = 0;
    let newCount = 0;

    for (let i = 0; i < totalCards; i++) {
      const status = studyStatus[`${set.id}_${i}`];
      if (status === 'learned') learned++;
      else if (status === 'review') review++;
      else newCount++;
    }

    return { ...set, totalCards, learned, review, newCount };
  });

  // Sort by word count (descending)
  setsWithStats.sort((a, b) => a.totalCards - b.totalCards);

  return (
    <div className="lesson-list">
      {setsWithStats.map(set => (
        <div
          key={set.id}
          className="lesson-card"
          onClick={() => onSelectLesson(set)}
        >
          <div className="lesson-card-header">
            <div className="lesson-name">{set.totalCards} từ</div>
            <span className="card-count">{set.learned}/{set.totalCards}</span>
          </div>
          <div className="lesson-card-stats">
            <span className="stat-badge learned">✓ {set.learned} đã học</span>
            <span className="stat-badge review">↻ {set.review} học lại</span>
            <span className="stat-badge new">○ {set.newCount} chưa học</span>
          </div>
        </div>
      ))}
    </div>
  );
}

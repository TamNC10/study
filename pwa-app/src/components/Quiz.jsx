import { useState, useMemo } from 'react';
import { saveQuizResult, getQuizResultsForSet } from '../lib/db';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateQuestions(items, allGroupItems) {
  const pool = allGroupItems.length >= 4 ? allGroupItems : items;

  return items.map((item, idx) => {
    // Get 3 wrong options from pool (exclude current item)
    const otherDefs = pool
      .filter((_, i) => pool === items ? i !== idx : pool.indexOf(item) !== i)
      .filter(o => o.definition !== item.definition);

    const wrongOptions = shuffle(otherDefs).slice(0, 3).map(o => o.definition);

    // If not enough wrong options, pad with placeholders
    while (wrongOptions.length < 3) {
      wrongOptions.push('---');
    }

    const options = shuffle([item.definition, ...wrongOptions]);

    return {
      kanji: item.kanji,
      correctAnswer: item.definition,
      options
    };
  });
}

export default function Quiz({ set, allGroupItems, onFinish }) {
  const questions = useMemo(
    () => generateQuestions(set.items, allGroupItems),
    [set.id]
  );

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);

  const history = getQuizResultsForSet(set.id);

  if (finished) {
    const correct = answers.filter(a => a.correct).length;
    return (
      <div className="quiz-container">
        <div className="quiz-result">
          <div className="score-label">Kết quả</div>
          <div className="score">{correct}/{questions.length}</div>
          <div className="score-label">
            {correct === questions.length ? '🎉 Xuất sắc!' :
             correct >= questions.length * 0.7 ? '👍 Tốt lắm!' :
             '💪 Cố gắng thêm!'}
          </div>
          <button onClick={onFinish}>Quay lại</button>
        </div>

        {history.length > 0 && (
          <div className="quiz-history">
            <h3>📊 Lịch sử kiểm tra</h3>
            {history.slice(-5).reverse().map((h, i) => (
              <div key={i} className="history-item">
                <span className="date">{new Date(h.date).toLocaleDateString('vi-VN')}</span>
                <span className="score">{h.score}/{h.total}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const q = questions[currentQ];

  const handleSelect = (option) => {
    if (selected !== null) return;
    setSelected(option);
    const correct = option === q.correctAnswer;
    setAnswers([...answers, { kanji: q.kanji, selected: option, correct }]);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
    } else {
      // Save result
      const correct = [...answers].filter(a => a.correct).length;
      // The last answer was already pushed
      saveQuizResult(set.id, {
        score: correct,
        total: questions.length
      });
      setFinished(true);
    }
  };

  return (
    <div className="quiz-container">
      <div className="quiz-progress">
        Câu {currentQ + 1} / {questions.length}
      </div>

      <div className="quiz-question">
        <div className="kanji-text">{q.kanji}</div>
      </div>

      <div className="quiz-options">
        {q.options.map((option, idx) => {
          let cls = 'quiz-option';
          if (selected !== null) {
            cls += ' disabled';
            if (option === q.correctAnswer) cls += ' correct';
            else if (option === selected && selected !== q.correctAnswer) cls += ' incorrect';
          }
          return (
            <button
              key={idx}
              className={cls}
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <button className="quiz-next" onClick={handleNext}>
          {currentQ < questions.length - 1 ? 'Câu tiếp →' : 'Xem kết quả'}
        </button>
      )}
    </div>
  );
}

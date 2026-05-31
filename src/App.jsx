import { useState, useEffect } from 'react';
import Header from './components/Header';
import LessonList from './components/LessonList';
import LessonDetail from './components/LessonDetail';
import StudyCards from './components/StudyCards';
import Quiz from './components/Quiz';
import { loadDatabase, getGroups, getSetsForGroup, getSetById, getAllItemsInGroup } from './lib/db';
import './App.css';

// Views: 'lessons' | 'detail' | 'study' | 'quiz'

export default function App() {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [view, setView] = useState('lessons');

  useEffect(() => {
    loadDatabase().then(database => {
      setDb(database);
      const grps = getGroups(database);
      setGroups(grps);
      if (grps.length > 0) {
        const firstName = grps[0].name;
        setSelectedGroup(firstName);
        setSets(getSetsForGroup(database, firstName));
      }
      setLoading(false);
    });
  }, []);

  const handleGroupChange = (groupName) => {
    setSelectedGroup(groupName);
    setSets(getSetsForGroup(db, groupName));
    setSelectedSet(null);
    setView('lessons');
  };

  const handleSelectLesson = (set) => {
    const fullSet = getSetById(db, set.id);
    setSelectedSet(fullSet);
    setView('detail');
  };

  const handleBack = () => {
    if (view === 'study' || view === 'quiz') {
      setView('detail');
    } else if (view === 'detail') {
      setSelectedSet(null);
      setView('lessons');
    }
  };

  const getTitle = () => {
    const wordCount = selectedSet?.items?.length || selectedSet?.totalCards || 0;
    if (view === 'study') return `📖 ${wordCount} từ`;
    if (view === 'quiz') return `✍️ ${wordCount} từ`;
    if (view === 'detail') return `${wordCount} từ`;
    return 'Nihongo Study';
  };

  if (loading) {
    return (
      <>
        <Header title="Nihongo Study" groups={[]} />
        <div className="main"><div className="loading">Đang tải dữ liệu...</div></div>
      </>
    );
  }

  return (
    <>
      <Header
        title={getTitle()}
        groups={view === 'lessons' ? groups : null}
        selectedGroup={selectedGroup}
        onGroupChange={handleGroupChange}
        onBack={view !== 'lessons' ? handleBack : null}
      />
      <main className="main">
        {view === 'lessons' && (
          <LessonList sets={sets} onSelectLesson={handleSelectLesson} />
        )}

        {view === 'detail' && selectedSet && (
          <LessonDetail
            set={selectedSet}
            onStudy={() => setView('study')}
            onQuiz={() => setView('quiz')}
          />
        )}

        {view === 'study' && selectedSet && (
          <StudyCards set={selectedSet} />
        )}

        {view === 'quiz' && selectedSet && (
          <Quiz
            set={selectedSet}
            allGroupItems={getAllItemsInGroup(db, selectedGroup)}
            onFinish={() => setView('detail')}
          />
        )}
      </main>
    </>
  );
}

'use client';

/**
 * VibeCheck — compatibility questionnaire.
 *
 * One question at a time. The user picks an answer, then rates how
 * much that topic matters to them. Each answer saves immediately, so
 * closing the tab halfway keeps their progress.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getUser } from '../../lib/api';
import Navbar from '../../components/Navbar';

const IMPORTANCE = [
  { value: 'a_little',    label: 'A little',    hint: 'Nice to share, not a big deal' },
  { value: 'somewhat',    label: 'Somewhat',    hint: 'I care about this'             },
  { value: 'very',        label: 'Very',        hint: 'This really matters to me'     },
  { value: 'dealbreaker', label: 'Dealbreaker', hint: 'We need to line up on this'    },
];

const CATEGORY_LABELS = {
  values:        '💎 Values & Life Goals',
  lifestyle:     '🏙️ Lifestyle',
  communication: '💬 Communication',
  social:        '🎉 Social Vibe',
  fun:           '🎧 Fun & Interests',
};

export default function QuestionnairePage() {
  const router = useRouter();
  const [user] = useState(() => (typeof window !== 'undefined' ? getUser() : null));

  const [questions, setQuestions]   = useState([]);
  const [answers, setAnswers]       = useState({});   // question_id -> {answer_index, importance}
  const [current, setCurrent]       = useState(0);
  const [picked, setPicked]         = useState(null); // answer_index picked for current question
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [finished, setFinished]     = useState(false);

  useEffect(() => {
    if (!getUser()) { router.replace('/login'); return; }
    (async () => {
      try {
        const data = await api.get('/api/questionnaire/questions');
        const qs = data.questions || [];
        const map = {};
        (data.answers || []).forEach((a) => {
          map[a.question_id] = { answer_index: a.answer_index, importance: a.importance };
        });
        setQuestions(qs);
        setAnswers(map);
        // resume at the first unanswered question
        const firstUnanswered = qs.findIndex((q) => !map[q.id]);
        if (firstUnanswered === -1 && qs.length > 0) setFinished(true);
        else setCurrent(Math.max(0, firstUnanswered));
      } catch (err) {
        setError(err.message || 'Could not load the quiz');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const q = questions[current];
  const answeredCount = useMemo(
    () => questions.filter((qq) => answers[qq.id]).length,
    [questions, answers]
  );
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  useEffect(() => {
    // preload previous pick when navigating back to an answered question
    if (q && answers[q.id]) setPicked(answers[q.id].answer_index);
    else setPicked(null);
  }, [current, q]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleImportance(importance) {
    if (picked == null || saving || !q) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/api/questionnaire/answers', {
        answers: [{ question_id: q.id, answer_index: picked, importance }],
      });
      const next = { ...answers, [q.id]: { answer_index: picked, importance } };
      setAnswers(next);
      if (current + 1 < questions.length) {
        setCurrent(current + 1);
      } else {
        setFinished(true);
      }
    } catch (err) {
      setError(err.message || 'Could not save that answer — try again');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <>
      <Navbar user={user} />
      <div className="main-content">
        <div className="loading-center"><div className="spinner" /></div>
      </div>
    </>
  );

  if (finished) return (
    <>
      <Navbar user={user} />
      <div className="main-content">
        <div className="page-wrapper" style={{ maxWidth: 560, paddingTop: '3rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ marginBottom: '.75rem' }}>VibeCheck complete</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              You answered all {questions.length} questions. Your match scores just got
              a whole lot smarter — every profile you see now reflects what actually
              matters to you.
            </p>
            <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/dashboard" className="btn btn-primary">See today&apos;s profiles</Link>
              <button className="btn btn-ghost" onClick={() => { setFinished(false); setCurrent(0); }}>
                Review my answers
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (!q) return (
    <>
      <Navbar user={user} />
      <div className="main-content">
        <div className="page-wrapper" style={{ maxWidth: 560, paddingTop: '3rem' }}>
          <div className="card empty-state">
            <h3>Quiz unavailable</h3>
            <p>{error || 'No questions found. Please try again later.'}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Navbar user={user} />
      <div className="main-content">
        <div className="page-wrapper" style={{ maxWidth: 640, paddingTop: '2rem', paddingBottom: '3rem' }}>

          {/* Progress */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
              <span style={{ fontSize: '.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {CATEGORY_LABELS[q.category] || q.category}
              </span>
              <span style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
                {current + 1} of {questions.length}
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--border, #eee)', borderRadius: 999 }}>
              <div style={{
                height: '100%', width: `${progress}%`, borderRadius: 999,
                background: 'var(--accent, var(--primary))', transition: 'width .3s',
              }} />
            </div>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.25rem', lineHeight: 1.3 }}>{q.question}</h2>

            {/* Answer options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.5rem' }}>
              {(q.options || []).map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setPicked(i)}
                  className="btn"
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    padding: '.8rem 1rem',
                    borderRadius: 'var(--radius, 10px)',
                    border: picked === i
                      ? '2px solid var(--accent, var(--primary))'
                      : '1px solid var(--border, #ddd)',
                    background: picked === i ? 'var(--accent-soft, rgba(0,0,0,.04))' : 'transparent',
                    fontWeight: picked === i ? 700 : 500,
                    cursor: 'pointer',
                  }}>
                  {opt}
                </button>
              ))}
            </div>

            {/* Importance — appears after an answer is picked */}
            {picked != null && (
              <div>
                <p style={{ fontWeight: 700, marginBottom: '.6rem', fontSize: '.95rem' }}>
                  How much does this matter to you?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '.5rem' }}>
                  {IMPORTANCE.map((lvl) => (
                    <button
                      key={lvl.value}
                      disabled={saving}
                      onClick={() => handleImportance(lvl.value)}
                      className="btn btn-ghost"
                      title={lvl.hint}
                      style={{
                        flexDirection: 'column', gap: '.15rem', padding: '.7rem .5rem',
                        border: '1px solid var(--border, #ddd)', borderRadius: 'var(--radius, 10px)',
                        opacity: saving ? 0.6 : 1,
                      }}>
                      <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{lvl.label}</span>
                      <span style={{ fontSize: '.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>{lvl.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p style={{ color: 'var(--danger, #d33)', marginTop: '1rem', fontSize: '.9rem' }}>{error}</p>
            )}
          </div>

          {/* Back / skip-for-now */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button
              className="btn btn-ghost btn-sm"
              disabled={current === 0}
              onClick={() => setCurrent(current - 1)}
              style={{ opacity: current === 0 ? 0.4 : 1 }}>
              ← Back
            </button>
            <Link href="/dashboard" className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }}>
              Finish later — progress is saved
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

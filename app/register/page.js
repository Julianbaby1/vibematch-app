'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, saveToken, saveUser } from '../../lib/api';

const LIFE_STAGES = ['Single', 'Divorced', 'Widowed', 'Separated', 'Other'];
const STEPS = ['Account', 'About you', 'Your story'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [prompts, setPrompts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', first_name: '', date_of_birth: '',
    life_stage: '', bio: '', location: '', city: '',
    interests: '',
    prompt_responses: [], // [{prompt_id, response}]
  });

  useEffect(() => {
    // Fetch prompts for step 2
    api.get('/api/users/prompts/list')
      .then((data) => setPrompts(data.slice(0, 3)))
      .catch(() => {});
  }, []);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  function setPromptResponse(promptId, value) {
    setForm((p) => {
      const filtered = p.prompt_responses.filter((r) => r.prompt_id !== promptId);
      return { ...p, prompt_responses: [...filtered, { prompt_id: promptId, response: value }] };
    });
  }

  function getPromptResponse(promptId) {
    return form.prompt_responses.find((r) => r.prompt_id === promptId)?.response || '';
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        interests: form.interests.split(',').map((i) => i.trim()).filter(Boolean),
      };
      const { token, user } = await api.post('/api/auth/register', payload);
      saveToken(token);
      saveUser(user);

      // Save prompt responses
      if (payload.prompt_responses.length > 0) {
        await api.put('/api/users/profile', { prompt_responses: payload.prompt_responses }).catch(() => {});
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 540 }}>
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '.9rem', display: 'block', marginBottom: '1rem' }}>
          ← Back
        </Link>
        <h1>Create your profile</h1>
        <p className="subtitle">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, margin: '1rem 0 1.75rem' }}>
          <div style={{
            height: '100%', borderRadius: 2, background: 'var(--primary)',
            width: `${((step + 1) / STEPS.length) * 100}%`, transition: 'width .3s'
          }} />
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* ── Step 0: Account ── */}
        {step === 0 && (
          <>
            <div className="form-group">
              <label className="form-label">Full first name</label>
              <input className="form-input" value={form.first_name} onChange={set('first_name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" className="form-input" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={form.password} onChange={set('password')}
                minLength={8} required />
              <span className="form-hint">At least 8 characters</span>
            </div>
            <div className="form-group">
              <label className="form-label">Date of birth</label>
              <input type="date" className="form-input" value={form.date_of_birth} onChange={set('date_of_birth')} required />
              <span className="form-hint">You must be 39 or older to join Second Wind</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }}
              disabled={!form.first_name || !form.email || !form.password || !form.date_of_birth}
              onClick={() => setStep(1)}>
              Continue →
            </button>
          </>
        )}

        {/* ── Step 1: About you ── */}
        {step === 1 && (
          <>
            <div className="form-group">
              <label className="form-label">Life stage</label>
              <select className="form-select" value={form.life_stage} onChange={set('life_stage')}>
                <option value="">Select…</option>
                {LIFE_STAGES.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" placeholder="e.g. Austin, TX" value={form.city} onChange={set('city')} />
            </div>
            <div className="form-group">
              <label className="form-label">Interests</label>
              <input className="form-input" placeholder="Hiking, cooking, travel, jazz…" value={form.interests}
                onChange={set('interests')} />
              <span className="form-hint">Comma-separated — up to 10</span>
            </div>
            <div className="form-group">
              <label className="form-label">Short bio</label>
              <textarea className="form-textarea" rows={3} value={form.bio} onChange={set('bio')}
                placeholder="A few sentences about who you are and what you're looking for…" />
            </div>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(2)}>
                Continue →
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Conversation prompts ── */}
        {step === 2 && (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '.95rem' }}>
              Your answers to these prompts help us find better matches and are shown
              as a preview to potential connections.
            </p>
            {prompts.map((p, i) => (
              <div className="form-group" key={p.id}>
                <label className="form-label">{i + 1}. {p.question}</label>
                <textarea className="form-textarea" rows={2}
                  value={getPromptResponse(p.id)}
                  onChange={(e) => setPromptResponse(p.id, e.target.value)}
                  placeholder="Share your honest answer…" />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating account…' : 'Create my profile ✓'}
              </button>
            </div>
          </>
        )}

        <p className="auth-switch" style={{ marginTop: '1.25rem' }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

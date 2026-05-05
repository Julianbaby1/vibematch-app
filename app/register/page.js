'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { api, saveUser } from '../../lib/api';

const LIFE_STAGES = ['Single', 'Divorced', 'Widowed', 'Separated', 'Other'];
const STEPS       = ['Account', 'About you', 'Your story'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [prompts, setPrompts] = useState([]);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', first_name: '', date_of_birth: '',
    life_stage: '', bio: '', location: '', city: '',
    interests: '',
    prompt_responses: [],
  });

  useEffect(() => {
    // Prompts endpoint is public — no auth needed yet
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/prompts/list`, {
      headers: { Authorization: 'Bearer public' },
    })
      .then((r) => r.json())
      .then((data) => setPrompts(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => {});
  }, []);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  function setPromptResponse(promptId, value) {
    setForm((p) => ({
      ...p,
      prompt_responses: [
        ...p.prompt_responses.filter((r) => r.prompt_id !== promptId),
        { prompt_id: promptId, response: value },
      ],
    }));
  }

  function getPromptResponse(promptId) {
    return form.prompt_responses.find((r) => r.prompt_id === promptId)?.response || '';
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);

    try {
      // 1. Express validates age + creates Supabase Auth user + profile row
      await api.post('/api/auth/register', {
        email:         form.email,
        password:      form.password,
        first_name:    form.first_name,
        date_of_birth: form.date_of_birth,
        life_stage:    form.life_stage || undefined,
        bio:           form.bio        || undefined,
        city:          form.city       || undefined,
      });

      // 2. Sign in via Supabase Auth (gets the session/access_token)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    form.email,
        password: form.password,
      });
      if (signInError) throw new Error(signInError.message);

      // 3. Save interests + prompt responses (now authenticated)
      const interests = form.interests.split(',').map((i) => i.trim()).filter(Boolean);
      await api.put('/api/users/profile', {
        interests,
        prompt_responses: form.prompt_responses,
      });

      // 4. Fetch and cache full profile
      const user = await api.get('/api/auth/me');
      saveUser(user);

      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 540 }}>
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '.88rem', display: 'inline-flex', alignItems: 'center', gap: '.3rem', marginBottom: '1.25rem' }}>
          ← Back to home
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.3rem' }}>✦</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Second Wind</span>
        </div>
        <h1 style={{ marginBottom: '.3rem' }}>Create your profile</h1>
        <p className="subtitle">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        {step === 0 && (
          <>
            <div className="form-group">
              <label className="form-label">First name</label>
              <input className="form-input" value={form.first_name} onChange={set('first_name')} placeholder="Your first name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" className="form-input" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={form.password} onChange={set('password')} minLength={8} placeholder="At least 8 characters" required />
              <span className="form-hint">At least 8 characters</span>
            </div>
            <div className="form-group">
              <label className="form-label">Date of birth</label>
              <input type="date" className="form-input" value={form.date_of_birth} onChange={set('date_of_birth')} required />
              <span className="form-hint">You must be 39 or older to join Second Wind</span>
            </div>
            <button
              className="btn btn-primary btn-full"
              disabled={!form.first_name || !form.email || !form.password || !form.date_of_birth}
              onClick={() => setStep(1)}>
              Continue →
            </button>
          </>
        )}

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
              <input className="form-input" placeholder="Hiking, cooking, travel, jazz…" value={form.interests} onChange={set('interests')} />
              <span className="form-hint">Comma-separated — up to 10</span>
            </div>
            <div className="form-group">
              <label className="form-label">Short bio</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={form.bio}
                onChange={set('bio')}
                placeholder="A few sentences about who you are and what you're looking for…"
              />
            </div>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(2)}>Continue →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '.93rem', lineHeight: 1.65 }}>
              Your answers help us find better matches and give potential connections a real preview of who you are.
            </p>
            {prompts.length === 0 && (
              <div className="alert alert-info">
                <span>ℹ️</span> Prompts are loading… you can skip this step if they don&apos;t appear.
              </div>
            )}
            {prompts.map((p, i) => (
              <div className="form-group" key={p.id}>
                <label className="form-label">{i + 1}. {p.question}</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={getPromptResponse(p.id)}
                  onChange={(e) => setPromptResponse(p.id, e.target.value)}
                  placeholder="Share your honest answer…"
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
                {loading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'center' }}><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account…</span>
                  : 'Create my profile ✓'}
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getUser } from '../../lib/api';
import Navbar from '../../components/Navbar';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getUser();
    if (!cached) { router.replace('/login'); return; }
    if (!cached.is_admin) { router.replace('/dashboard'); return; }
    setUser(cached);
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, usersData, reportsData] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/reports'),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setReports(reportsData);
    } catch {
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleBan(userId, isBanned) {
    const action = isBanned ? 'unban' : 'ban';
    const reason = !isBanned ? prompt('Reason for ban (optional):') : undefined;
    try {
      await api.post(`/api/admin/${action}/${userId}`, { reason });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_banned: !isBanned } : u));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleReportStatus(reportId, status) {
    try {
      await api.patch(`/api/admin/reports/${reportId}`, { status });
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status } : r));
    } catch (err) {
      alert(err.message);
    }
  }

  const filteredUsers = users.filter((u) =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <>
      <Navbar user={user} />
      <div className="main-content"><div className="loading-center"><div className="spinner" /></div></div>
    </>
  );

  return (
    <>
      <Navbar user={user} />
      <div className="main-content">
        <div className="page-wrapper" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
          <div className="page-title">
            <h1>Admin Panel</h1>
            <p>Monitor engagement, manage users, and review reports.</p>
          </div>

          {/* Stats grid */}
          {stats && (
            <div className="admin-stats-grid">
              {[
                { label: 'Total users',    value: stats.total_users },
                { label: 'New today',      value: stats.new_users_today },
                { label: 'Active (7d)',    value: stats.active_users_week },
                { label: 'Total matches',  value: stats.total_matches },
                { label: 'Messages sent',  value: stats.total_messages },
                { label: 'Upcoming events',value: stats.upcoming_events },
                { label: 'Pending reports',value: stats.pending_reports },
              ].map(({ label, value }) => (
                <div key={label} className="admin-stat-card">
                  <div className="admin-stat-value">{value?.toLocaleString()}</div>
                  <div className="admin-stat-label">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '.5rem' }}>
            {['overview', 'users', 'reports'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
                style={{ textTransform: 'capitalize' }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Users table */}
          {activeTab === 'users' && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <input className="form-input" placeholder="Search by name or email…" value={search}
                  onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>City</th>
                        <th>Visibility</th>
                        <th>Matches</th>
                        <th>Reports</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600 }}>{u.first_name}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>{u.email}</td>
                          <td>{u.city || '—'}</td>
                          <td>{u.visibility_score}</td>
                          <td>{u.match_count}</td>
                          <td>{u.report_count > 0 ? <span className="badge badge-amber">{u.report_count}</span> : '0'}</td>
                          <td>
                            {u.is_banned
                              ? <span className="badge badge-purple">Banned</span>
                              : u.is_admin
                              ? <span className="badge badge-blue">Admin</span>
                              : <span className="badge badge-green">Active</span>}
                          </td>
                          <td>
                            {!u.is_admin && (
                              <button className={`btn btn-sm ${u.is_banned ? 'btn-outline' : 'btn-danger'}`}
                                onClick={() => handleBan(u.id, u.is_banned)}>
                                {u.is_banned ? 'Unban' : 'Ban'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Reports table */}
          {activeTab === 'reports' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Reporter</th>
                      <th>Reported user</th>
                      <th>Reason</th>
                      <th>Details</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id}>
                        <td>{r.reporter_name}</td>
                        <td style={{ fontWeight: 600 }}>{r.reported_name}</td>
                        <td>{r.reason}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '.85rem' }}>
                          {r.details || '—'}
                        </td>
                        <td style={{ fontSize: '.83rem', color: 'var(--text-muted)' }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={`badge ${r.status === 'pending' ? 'badge-amber' : r.status === 'resolved' ? 'badge-green' : 'badge-blue'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>
                          {r.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '.4rem' }}>
                              <button className="btn btn-sm btn-outline" onClick={() => handleReportStatus(r.id, 'reviewed')}>Review</button>
                              <button className="btn btn-sm btn-primary"  onClick={() => handleReportStatus(r.id, 'resolved')}>Resolve</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Platform health</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Overview of key engagement metrics. Switch to the Users or Reports tab to take action.
              </p>
              <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                <div className="stat-block">
                  <div className="stat-value">{stats ? Math.round((stats.active_users_week / Math.max(stats.total_users, 1)) * 100) : 0}%</div>
                  <div className="stat-label">7-day retention</div>
                </div>
                <div className="stat-block">
                  <div className="stat-value">{stats ? Math.round(stats.total_messages / Math.max(stats.total_matches, 1)) : 0}</div>
                  <div className="stat-label">Avg messages per match</div>
                </div>
                <div className="stat-block">
                  <div className="stat-value">{stats?.pending_reports || 0}</div>
                  <div className="stat-label">Pending reports</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

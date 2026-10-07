'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Shell from '../../../components/Shell';
import { api } from '../../../lib/api';

type Zone = {
  id: number;
  name: string;
  zone_type: string;
  comment: string;
  private_zone: boolean;
  record_count: number;
  created_at: string;
  updated_at: string;
};

type Rec = {
  id: number;
  name: string;
  type: string;
  ttl: number;
  value: string;
  priority?: number | null;
  weight?: number | null;
  port?: number | null;
};

type Activity = {
  id: number;
  zone_id: number | null;
  action: string;
  resource_type: string;
  resource_name: string;
  details: string;
  created_at: string;
};

const types = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA'];

export default function ZonePage() {
  const { zoneId } = useParams();
  const r = useRouter();

  const [zone, setZone] = useState<Zone | null>(null);
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<Rec[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('records');

  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Rec | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [form, setForm] = useState<any>({
    name: '',
    type: 'A',
    ttl: 300,
    value: '',
    priority: '',
    weight: '',
    port: '',
  });

  const [zoneEdit, setZoneEdit] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneComment, setZoneComment] = useState('');
  const [zonePrivate, setZonePrivate] = useState(false);

  async function load() {
    try {
      const [z, rs, acts] = await Promise.all([
        api('/api/zones/' + zoneId),
        api(
          '/api/zones/' +
            zoneId +
            '/records?search=' +
            encodeURIComponent(q) +
            '&type=' +
            filter +
            '&page=' +
            page +
            '&limit=10'
        ),
        api('/api/activity'),
      ]);

      setZone(z);
      setRecords(rs);

      const zoneActivities = acts.filter(
        (a: Activity) => a.zone_id === Number(zoneId)
      );
      setActivities(zoneActivities);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, [q, filter, zoneId, page]);

  async function saveZoneEdit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const updated = await api('/api/zones/' + zoneId, {
        method: 'PATCH',
        body: JSON.stringify({
          name: zoneName,
          comment: zoneComment,
          private_zone: zonePrivate,
        }),
      });

      setZone(updated);
      setZoneEdit(false);
      setToast('Hosted zone updated');
      setTimeout(() => setToast(''), 2200);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function deleteZone() {
    if (!confirm('Delete this hosted zone and all of its records?')) return;

    try {
      await api('/api/zones/' + zoneId, {
        method: 'DELETE',
      });

      r.push('/zones');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({
      name: '',
      type: 'A',
      ttl: 300,
      value: '',
      priority: '',
      weight: '',
      port: '',
    });
    setError('');
    setShow(true);
  }

  function openEdit(x: Rec) {
    setEditing(x);
    setForm({
      ...x,
      priority: x.priority ?? '',
      weight: x.weight ?? '',
      port: x.port ?? '',
    });
    setError('');
    setShow(true);
  }

  function update(k: string, v: any) {
    setForm((f: any) => ({
      ...f,
      [k]: v,
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const body = {
      ...form,
      ttl: Number(form.ttl),
      priority: form.priority === '' ? null : Number(form.priority),
      weight: form.weight === '' ? null : Number(form.weight),
      port: form.port === '' ? null : Number(form.port),
    };

    try {
      if (editing) {
        await api(
          '/api/zones/' + zoneId + '/records/record/' + editing.id,
          {
            method: 'PATCH',
            body: JSON.stringify(body),
          }
        );
      } else {
        await api('/api/zones/' + zoneId + '/records', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }

      setShow(false);
      setToast(editing ? 'Record updated' : 'Record created');
      setTimeout(() => setToast(''), 2200);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function del(x: Rec) {
    if (!confirm(`Delete ${x.name} ${x.type}?`)) return;

    try {
      await api('/api/zones/' + zoneId + '/records/record/' + x.id, {
        method: 'DELETE',
      });

      setToast('Record deleted');
      setTimeout(() => setToast(''), 2200);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!zone) {
    return (
      <Shell>
        <div className="content">
          {error ? (
            <div className="alert">{error}</div>
          ) : (
            <div className="empty">Loading zone…</div>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="content">
        <div className="crumb">
          RoutePilot / <span>Hosted Zones</span> / {zone.name}
        </div>

        <div className="heading">
          <div>
            <h1>{zone.name}</h1>
            <p className="sub" style={{ marginBottom: 0 }}>
              {zone.zone_type} · {zone.comment || 'No comment'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn"
              onClick={() => {
                setZoneEdit(true);
                setZoneName(zone.name);
                setZoneComment(zone.comment || '');
                setZonePrivate(zone.private_zone);
                setError('');
              }}
            >
              Edit zone
            </button>

            <button className="btn danger" onClick={deleteZone}>
              Delete zone
            </button>

            <button className="btn primary" onClick={openCreate}>
              Create record
            </button>
          </div>
        </div>

        <div className="stats" style={{ margin: '22px 0' }}>
          <div className="card">
            <div className="statlabel">Records</div>
            <div className="statvalue">{zone.record_count}</div>
          </div>

          <div className="card">
            <div className="statlabel">Zone type</div>
            <div className="statvalue" style={{ fontSize: 17 }}>
              {zone.zone_type}
            </div>
          </div>

          <div className="card">
            <div className="statlabel">Name servers</div>
            <div className="statvalue" style={{ fontSize: 17 }}>
              4
            </div>
          </div>

          <div className="card">
            <div className="statlabel">Last modified</div>
            <div className="statvalue" style={{ fontSize: 15 }}>
              {new Date(zone.updated_at).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            Records
          </button>

          <button
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Hosted zone details
          </button>

          <button
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
        </div>

        {activeTab === 'records' && (
          <>
            <div className="toolbar">
              <input
                className="search"
                placeholder="Search records"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />

              <select
                className="select"
                style={{ maxWidth: 150 }}
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All types</option>
                {types.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Record name</th>
                    <th>Type</th>
                    <th>TTL</th>
                    <th>Value</th>
                    <th>Routing</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <span className="link">{x.name}</span>
                      </td>

                      <td>
                        <span className="pill">{x.type}</span>
                      </td>

                      <td>{x.ttl}</td>

                      <td
                        style={{
                          maxWidth: 470,
                          wordBreak: 'break-word',
                        }}
                      >
                        {x.value}
                      </td>

                      <td className="muted">Simple</td>

                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className="btn"
                          onClick={() => openEdit(x)}
                        >
                          Edit
                        </button>{' '}

                        <button
                          className="btn danger"
                          onClick={() => del(x)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <button
                  className="btn"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>

                <span className="muted">Page {page}</span>

                <button
                  className="btn"
                  disabled={records.length < 10}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>

              {!records.length && (
                <div className="empty">
                  No records match the current filters.
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'details' && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Hosted zone details</h3>

            <div className="formgrid">
              <label>Domain name</label>
              <div>{zone.name}</div>

              <label>Zone type</label>
              <div>{zone.zone_type}</div>

              <label>Comment</label>
              <div>{zone.comment || '—'}</div>

              <label>Record count</label>
              <div>{zone.record_count}</div>

              <label>Created</label>
              <div>{new Date(zone.created_at).toLocaleString()}</div>

              <label>Last modified</label>
              <div>{new Date(zone.updated_at).toLocaleString()}</div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="tablewrap">
            {activities.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Details</th>
                    <th>Time</th>
                  </tr>
                </thead>

                <tbody>
                  {activities.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <span className="pill">{a.action}</span>
                      </td>

                      <td>
                        <strong>{a.resource_name}</strong>
                        <div className="muted">
                          {a.resource_type}
                        </div>
                      </td>

                      <td>{a.details}</td>

                      <td className="muted">
                        {new Date(a.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">
                No activity has been recorded for this hosted zone.
              </div>
            )}
          </div>
        )}
      </div>

      {show && (
        <div className="modalback">
          <div className="modal">
            <div className="modalhead">
              {editing ? 'Edit record' : 'Create record'}
            </div>

            <form onSubmit={save}>
              <div className="modalbody">
                {error && <div className="alert">{error}</div>}

                <div
                  className="card"
                  style={{ background: '#f8f9f9' }}
                >
                  <strong>Change preview</strong>

                  <div
                    style={{
                      marginTop: 10,
                      fontFamily: 'monospace',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: '#087f23' }}>
                      {editing ? '~ UPDATE' : ' + CREATE'}
                    </span>{' '}
                    &nbsp; {form.name || 'record-name'} &nbsp;{' '}
                    {form.type} &nbsp; {form.value || 'value'}
                  </div>
                </div>

                <div className="formgrid">
                  <label>Record name</label>

                  <input
                    className="field"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder={'api.' + zone.name}
                    required
                  />

                  <label>Record type</label>

                  <select
                    className="select"
                    value={form.type}
                    onChange={(e) => update('type', e.target.value)}
                  >
                    {types.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>

                  <label>TTL</label>

                  <input
                    className="field"
                    type="number"
                    value={form.ttl}
                    onChange={(e) => update('ttl', e.target.value)}
                  />

                  <label>Value</label>

                  <textarea
                    className="textarea"
                    value={form.value}
                    onChange={(e) => update('value', e.target.value)}
                    required
                    placeholder={
                      form.type === 'A'
                        ? '203.0.113.42'
                        : 'Enter record value'
                    }
                  />

                  {['MX', 'SRV', 'CAA'].includes(form.type) && (
                    <>
                      <label>Priority</label>

                      <input
                        className="field"
                        type="number"
                        value={form.priority}
                        onChange={(e) =>
                          update('priority', e.target.value)
                        }
                      />
                    </>
                  )}

                  {form.type === 'SRV' && (
                    <>
                      <label>Weight</label>

                      <input
                        className="field"
                        type="number"
                        value={form.weight}
                        onChange={(e) =>
                          update('weight', e.target.value)
                        }
                      />

                      <label>Port</label>

                      <input
                        className="field"
                        type="number"
                        value={form.port}
                        onChange={(e) =>
                          update('port', e.target.value)
                        }
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="modalfoot">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShow(false)}
                >
                  Cancel
                </button>

                <button className="btn primary">
                  {editing ? 'Save changes' : 'Create record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {zoneEdit && (
        <div className="modalback">
          <div className="modal">
            <div className="modalhead">Edit hosted zone</div>

            <form onSubmit={saveZoneEdit}>
              <div className="modalbody">
                {error && <div className="alert">{error}</div>}

                <div className="formgrid">
                  <label>Domain name</label>

                  <input
                    className="field"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    required
                  />

                  <label>Comment</label>

                  <textarea
                    className="textarea"
                    value={zoneComment}
                    onChange={(e) =>
                      setZoneComment(e.target.value)
                    }
                  />

                  <label>Zone type</label>

                  <div>
                    <label style={{ fontWeight: 400 }}>
                      <input
                        type="checkbox"
                        checked={zonePrivate}
                        onChange={(e) =>
                          setZonePrivate(e.target.checked)
                        }
                      />{' '}
                      Private hosted zone
                    </label>
                  </div>
                </div>
              </div>

              <div className="modalfoot">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setZoneEdit(false)}
                >
                  Cancel
                </button>

                <button className="btn primary">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </Shell>
  );
}
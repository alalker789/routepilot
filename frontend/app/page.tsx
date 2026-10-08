'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '../components/Shell';
import { api } from '../lib/api';

type Stats = {
  hosted_zones: number;
  public_zones: number;
  managed_records: number;
};

export default function Home() {
  const r = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('routepilot_token')) {
      r.push('/login');
      return;
    }

    api('/api/zones/stats')
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [r]);

  return (
    <Shell>
      <div className="content">
        <div className="crumb">
          RoutePilot / Dashboard
        </div>

        <div className="heading">
          <h1>DNS console</h1>
        </div>

        <p className="sub">
          A focused workspace for managing hosted zones and records.
        </p>

        <div className="stats">
          <div className="card">
            <div className="statlabel">Hosted zones</div>
            <div className="statvalue">
              {loading ? '—' : stats?.hosted_zones ?? 0}
            </div>
          </div>

          <div className="card">
            <div className="statlabel">Managed records</div>
            <div className="statvalue">
              {loading ? '—' : stats?.managed_records ?? 0}
            </div>
          </div>

          <div className="card">
            <div className="statlabel">Public zones</div>
            <div className="statvalue">
              {loading ? '—' : stats?.public_zones ?? 0}
            </div>
          </div>

          <div className="card">
            <div className="statlabel">Last change</div>
            <div
              className="statvalue"
              style={{ fontSize: 16 }}
            >
              {loading ? '—' : 'A few moments ago'}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            Recent activity
          </h3>

          <p className="muted">
            Changes made in this console are recorded here.
            Open Hosted Zones to start managing DNS.
          </p>

          <a className="link" href="/zones">
            View hosted zones →
          </a>
        </div>
      </div>
    </Shell>
  );
}
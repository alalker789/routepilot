'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '../components/Shell';
import { api } from '../lib/api';

type Zone = {
  id: number;
  name: string;
  zone_type: string;
  record_count: number;
  updated_at: string;
};

export default function Home() {
  const r = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('routepilot_token')) {
      r.push('/login');
      return;
    }

    api('/api/zones')
      .then((data) => setZones(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [r]);

  const hostedZones = zones.length;

  const managedRecords = zones.reduce(
    (total, zone) => total + (zone.record_count || 0),
    0
  );

  const publicZones = zones.filter(
    (zone) => zone.zone_type === 'Public hosted zone'
  ).length;

  return (
    <Shell>
      <div className="content">
        <div className="crumb">RoutePilot / Dashboard</div>

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
              {loading ? '—' : hostedZones}
            </div>
          </div>

          <div className="card">
            <div className="statlabel">Managed records</div>
            <div className="statvalue">
              {loading ? '—' : managedRecords}
            </div>
          </div>

          <div className="card">
            <div className="statlabel">Public zones</div>
            <div className="statvalue">
              {loading ? '—' : publicZones}
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
          <h3 style={{ marginTop: 0 }}>Recent activity</h3>

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
'use client';import {useEffect,useState} from 'react';import {useRouter} from 'next/navigation';import Shell from '../../components/Shell';import {api} from '../../lib/api';
type Zone={id:number,name:string,zone_type:string,comment:string,private_zone:boolean,record_count:number,created_at:string,updated_at:string};
export default function Zones(){const [zones,setZones]=useState<Zone[]>([]),[q,setQ]=useState(''),[page,setPage]=useState(1),[show,setShow]=useState(false),[name,setName]=useState(''),[comment,setComment]=useState(''),[privateZone,setPrivateZone]=useState(false),[error,setError]=useState('');const r=useRouter();const load=()=>api('/api/zones?search='+encodeURIComponent(q)+'&page='+page+'&limit=10').then(setZones).catch(e=>{if(e.message.includes('Authentication'))r.push('/login')});useEffect(()=>{load()},[q,page]);async function create(e:React.FormEvent){e.preventDefault();setError('');try{await api('/api/zones',{method:'POST',body:JSON.stringify({name,comment,private_zone:privateZone})});setShow(false);setName('');setComment('');setPrivateZone(false);load()}catch(e){setError((e as Error).message)}}return <Shell><div className="content"><div className="crumb">RoutePilot / <span>Hosted Zones</span></div><div className="heading"><h1>Hosted zones</h1><button className="btn primary" onClick={()=>setShow(true)}>Create hosted zone</button></div><p className="sub">Manage the DNS zones associated with this console.</p><div className="toolbar"><input className="search" placeholder="Search hosted zones" value={q} onChange={e=>{setQ(e.target.value);setPage(1)}}/><button className="btn">Refresh</button></div><div className="tablewrap"><table className="table"><thead><tr><th>Hosted zone name</th><th>Type</th><th>Records</th><th>Comment</th><th>Last modified</th></tr></thead><tbody>{zones.map(z=><tr key={z.id}><td><span className="link" onClick={()=>r.push('/zones/'+z.id)}>{z.name}</span></td><td><span className="pill">{z.zone_type}</span></td><td>{z.record_count}</td><td className="muted">{z.comment||'—'}</td><td className="muted">{new Date(z.updated_at).toLocaleDateString()}</td></tr>)}</tbody></table>

{!zones.length&&<div className="empty">No hosted zones match your search.</div>}

<div className="pagination">
  <button
    className="btn"
    disabled={page===1}
    onClick={()=>setPage(page-1)}
  >
    Previous
  </button>

  <span className="muted">Page {page}</span>

  <button
    className="btn"
    disabled={zones.length<10}
    onClick={()=>setPage(page+1)}
  >
    Next
  </button>
</div>
</div></div>{show&&<div className="modalback"><div className="modal"><div className="modalhead">Create hosted zone</div><form onSubmit={create}><div className="modalbody">{error&&<div className="alert">{error}</div>}<div className="formgrid"><label>Domain name</label><div><input className="field" value={name} onChange={e=>setName(e.target.value)} placeholder="northstar.dev" required/><div className="hint">Enter the domain name without a trailing dot.</div></div><label>Comment</label><textarea className="textarea" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Primary public zone"/><label>Zone type</label><div><label style={{fontWeight:400}}><input type="checkbox" checked={privateZone} onChange={e=>setPrivateZone(e.target.checked)}/> Private hosted zone</label></div></div></div><div className="modalfoot"><button type="button" className="btn" onClick={()=>setShow(false)}>Cancel</button><button className="btn primary">Create hosted zone</button></div></form></div></div>}</Shell>}

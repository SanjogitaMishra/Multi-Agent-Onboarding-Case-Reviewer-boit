import React, { useEffect, useState } from 'react'
import type { CaseDB, AutonomyMode } from '@bank/shared'

type RunResult = {
  recommendation?: { result: string; notes?: string; createdAt?: string }
  findings?: any[]
  trace?: any[]
}

export default function App() {
  const [cases, setCases] = useState<CaseDB[]>([])
  const [selected, setSelected] = useState<CaseDB | null>(null)
  const [mode, setMode] = useState<AutonomyMode>('AUTONOMOUS')
  const [running, setRunning] = useState(false)
  const [lastRun, setLastRun] = useState<RunResult | null>(null)

  useEffect(() => {
    fetch('/api/cases')
      .then((r) => r.json())
      .then(setCases)
      .catch(console.error)
  }, [])

  const runOrchestrator = async () => {
    if (!selected) return
    setRunning(true)
    setLastRun(null)
    try {
      const res = await fetch(`/api/cases/${selected.id}/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      })
      const body = await res.json()
      setLastRun({ recommendation: body.recommendation, findings: body.findings, trace: body.trace })
      // refresh cases list/status
      const fresh = await fetch('/api/cases').then((r) => r.json())
      setCases(fresh)
      setSelected(fresh.find((c: CaseDB) => c.id === selected.id) || null)
    } catch (e) {
      console.error(e)
    } finally {
      setRunning(false)
    }
  }

  const doManualReview = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    await fetch(`/api/cases/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer: 'ui', action: action === 'APPROVED' ? 'APPROVE' : 'REJECT' })
    })
    const fresh = await fetch('/api/cases').then((r) => r.json())
    setCases(fresh)
    setSelected(fresh.find((c: CaseDB) => c.id === id) || null)
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Onboarding Cases</h1>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ width: 360 }}>
          <h3>Cases</h3>
          <ul>
            {cases.map((c) => (
              <li key={c.id} style={{ marginBottom: 8 }}>
                <button onClick={() => setSelected(c)} style={{ fontWeight: selected?.id === c.id ? 'bold' : 'normal' }}>{c.applicantName}</button>
                <div style={{ fontSize: 12 }}>{c.status}</div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ flex: 1 }}>
          {selected ? (
            <div>
              <h3>{selected.applicantName}</h3>
              <div>Email: {selected.email}</div>
              <div>Risk: {(selected.riskIndicators || []).join(', ')}</div>

              <div style={{ marginTop: 12 }}>
                <label>Autonomy Mode: </label>
                <select value={mode} onChange={(e) => setMode(e.target.value as AutonomyMode)}>
                  <option value="AUTONOMOUS">AUTONOMOUS</option>
                  <option value="ASSISTIVE">ASSISTIVE</option>
                  <option value="MANUAL">MANUAL</option>
                </select>
                <button onClick={runOrchestrator} disabled={running} style={{ marginLeft: 8 }}>{running ? 'Running…' : 'Run Review'}</button>
                <button onClick={() => doManualReview(selected.id, 'APPROVED')} style={{ marginLeft: 8 }}>Approve</button>
                <button onClick={() => doManualReview(selected.id, 'REJECTED')} style={{ marginLeft: 8 }}>Reject</button>
              </div>

              {lastRun && (
                <div style={{ marginTop: 16 }}>
                  <h4>Recommendation: {lastRun.recommendation?.result}</h4>
                  <div>Notes: {lastRun.recommendation?.notes}</div>
                  <h5>Findings</h5>
                  <pre style={{ background: '#f6f6f6', padding: 8 }}>{JSON.stringify(lastRun.findings, null, 2)}</pre>
                  <h5>Execution Trace</h5>
                  <pre style={{ background: '#f6f6f6', padding: 8 }}>{JSON.stringify(lastRun.trace, null, 2)}</pre>
                </div>
              )}
            </div>
          ) : (
            <div>Select a case to inspect</div>
          )}
        </div>
      </div>
    </div>
  )
}

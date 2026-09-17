import React, { useEffect, useState } from 'react'
import type { CaseRecord } from '@bank/shared'

export default function App() {
  const [cases, setCases] = useState<CaseRecord[]>([])

  useEffect(() => {
    fetch('/api/cases')
      .then((r) => r.json())
      .then(setCases)
      .catch(console.error)
  }, [])

  const review = async (id: string, action: 'APPROVE' | 'REJECT') => {
    await fetch(`/api/cases/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer: 'local', action })
    })
    setCases((c) => c.map((x) => (x.id === id ? { ...x, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : x)))
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Onboarding Cases</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Applicant</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.id}>
              <td>{c.applicantName}</td>
              <td>{c.status}</td>
              <td>
                <button onClick={() => review(c.id, 'APPROVE')}>Approve</button>
                <button onClick={() => review(c.id, 'REJECT')} style={{ marginLeft: 8 }}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

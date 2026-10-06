import React, { useState } from 'react';
import { toast } from 'sonner';

export default function Input() {
  const [formData, setFormData] = useState({ date: '', client: '', description: '' });

  const handleClear = () => {
    setFormData({ date: '', client: '', description: '' });
    toast.info('Form cleared');
  };

  const handleSubmit = () => {
    toast.success('Journal Entry successfully submitted!');
    setFormData({ date: '', client: '', description: '' });
  };

  return (
    <div className="page-container fade-in" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Manual Input</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
          Manual data entry for accounting inputs.
        </p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-light)', padding: '24px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem' }}>New Journal Entry</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Client</label>
              <select value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})}>
                <option value="">Select a client...</option>
                <option value="cl001">CL001 - Acme Corp</option>
                <option value="cl002">CL002 - Globex Inc</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <input type="text" placeholder="Enter entry description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          
          <div style={{ border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden', marginTop: '24px' }}>
            <table className="data-table">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th>Account</th>
                  <th>Debit</th>
                  <th>Credit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <select style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none' }}>
                      <option>1400 - Prepaid Expenses</option>
                    </select>
                  </td>
                  <td><input type="number" placeholder="0.00" style={{ width: '100px', border: 'none', background: 'transparent', outline: 'none' }} /></td>
                  <td><input type="number" placeholder="0.00" style={{ width: '100px', border: 'none', background: 'transparent', outline: 'none' }} disabled /></td>
                </tr>
                <tr>
                  <td>
                    <select style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none' }}>
                      <option>2100 - Accrued Liabilities</option>
                    </select>
                  </td>
                  <td><input type="number" placeholder="0.00" style={{ width: '100px', border: 'none', background: 'transparent', outline: 'none' }} disabled /></td>
                  <td><input type="number" placeholder="0.00" style={{ width: '100px', border: 'none', background: 'transparent', outline: 'none' }} /></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button className="btn-outline" onClick={handleClear}>Clear Form</button>
            <button className="btn-primary-sm" onClick={handleSubmit}>Submit Entry</button>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-light)', padding: '24px', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Recent Entries</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ padding: '12px', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>JE-2024-{i}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Today</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Acme Corp - Accrual</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

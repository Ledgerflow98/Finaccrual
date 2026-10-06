import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppState } from '../../context/AppContext';

export default function Workpapers() {
  const { state, dispatch } = useAppState();
  const { workpapers } = state;

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('All Clients');
  
  // Modal Form State
  const [client, setClient] = useState('CL001 - Acme Corp');
  const [period, setPeriod] = useState('');

  const filteredWorkpapers = workpapers.filter(wp => {
    const matchesSearch = wp.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          wp.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          wp.preparer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClient = clientFilter === 'All Clients' || wp.client.includes(clientFilter);
    return matchesSearch && matchesClient;
  });

  const handleCreateWorkpaper = () => {
    if (!period) {
      toast.error('Period is required');
      return;
    }
    
    // Convert YYYY-MM to MMM YYYY for display
    const dateObj = new Date(period + '-01T00:00:00');
    const formattedPeriod = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    dispatch({
      type: 'ADD_WORKPAPER',
      payload: {
        id: `WP-24-${11 + workpapers.length}`,
        client,
        period: formattedPeriod,
        preparer: 'You',
        status: 'In Progress'
      }
    });
    
    setIsModalOpen(false);
    setPeriod('');
    toast.success('Workpaper created and assigned!');
  };

  return (
    <div className="page-container fade-in" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Workpapers</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
          Review workpapers and audit trails.
        </p>
      </header>
      
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div className="data-toolbar">
          <input 
            type="text" 
            placeholder="Search workpapers..." 
            className="search-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select 
            className="toolbar-select" 
            style={{ width: '150px' }}
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
          >
            <option>All Clients</option>
            <option>Acme Corp</option>
            <option>Globex Inc</option>
          </select>
          <div style={{ flex: 1 }}></div>
          <button className="btn-primary-sm" onClick={() => setIsModalOpen(true)}>Create Workpaper</button>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Workpaper ID ▲</th>
              <th>Client</th>
              <th>Period</th>
              <th>Preparer</th>
              <th>Review Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkpapers.map((wp, i) => (
              <tr key={i}>
                <td>{wp.id}</td>
                <td style={{ fontWeight: 500 }}>{wp.client}</td>
                <td>{wp.period}</td>
                <td>{wp.preparer}</td>
                <td>
                  <span style={{ 
                    color: wp.status === 'Approved' ? '#10b981' : wp.status === 'Pending Review' ? 'var(--primary)' : 'var(--text-muted)', 
                    fontWeight: 500 
                  }}>
                    {wp.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="action-btn" onClick={() => toast.info(`Opening ${wp.id}...`)}>Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Workpaper</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Client</label>
                <select value={client} onChange={e => setClient(e.target.value)}>
                  <option>CL001 - Acme Corp</option>
                  <option>CL002 - Globex Inc</option>
                </select>
              </div>
              <div className="form-group">
                <label>Period</label>
                <input type="month" value={period} onChange={e => setPeriod(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Template</label>
                <select>
                  <option>Standard Accrual WP</option>
                  <option>Prepaid Amortization WP</option>
                  <option>Blank Workpaper</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary-sm" onClick={handleCreateWorkpaper}>Create Workpaper</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

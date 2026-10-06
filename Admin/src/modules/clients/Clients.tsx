import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppState } from '../../context/AppContext';

export default function Clients() {
  const { state, dispatch } = useAppState();
  const { clients } = state;

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPlan, setClientPlan] = useState('QBO Pro');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveClient = () => {
    if (!clientName.trim()) {
      toast.error('Client name is required');
      return;
    }
    
    const newId = `CL00${clients.length + 1}`;
    dispatch({
      type: 'ADD_CLIENT',
      payload: {
        id: newId,
        name: clientName,
        contact: clientEmail || 'N/A',
        plan: clientPlan,
        status: 'Active'
      }
    });
    
    setIsModalOpen(false);
    setClientName('');
    setClientEmail('');
    setClientPlan('QBO Pro');
    toast.success('New client successfully added!');
  };

  return (
    <div className="page-container fade-in" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Clients</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
          Manage client details and subscriptions.
        </p>
      </header>
      
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div className="data-toolbar">
          <input 
            type="text" 
            placeholder="Search clients..." 
            className="search-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div style={{ flex: 1 }}></div>
          <button className="btn-outline" onClick={() => toast.success('Client list exported to Excel.')}>Export List</button>
          <button className="btn-primary-sm" onClick={() => setIsModalOpen(true)}>Add Client</button>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Client ID ▲</th>
              <th>Client Name</th>
              <th>Contact</th>
              <th>Subscription Plan</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client, i) => (
              <tr key={i}>
                <td>{client.id}</td>
                <td style={{ fontWeight: 500 }}>{client.name}</td>
                <td>{client.contact}</td>
                <td>{client.plan}</td>
                <td>
                  <span className={client.status === 'Active' ? 'status-active' : ''} style={{ color: client.status === 'Inactive' ? 'var(--text-muted)' : 'inherit' }}>
                    {client.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="action-btn">Edit</button>
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
              <h3>Add New Client</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Client Name</label>
                <input type="text" placeholder="e.g. Initech" value={clientName} onChange={e => setClientName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input type="email" placeholder="contact@initech.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Subscription Plan</label>
                <select value={clientPlan} onChange={e => setClientPlan(e.target.value)}>
                  <option>QBO Pro</option>
                  <option>Enterprise</option>
                  <option>Basic</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary-sm" onClick={handleSaveClient}>Save Client</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

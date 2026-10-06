import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppState } from '../../context/AppContext';

export default function MasterData() {
  const { state, dispatch } = useAppState();
  const { accounts } = state;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Accounts');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All types');

  const [accId, setAccId] = useState('');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('Asset');

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || acc.id.includes(searchQuery);
    const matchesType = typeFilter === 'All types' || acc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSaveAccount = () => {
    if (!accId || !accName) {
      toast.error('Account ID and Name are required');
      return;
    }
    
    dispatch({
      type: 'ADD_ACCOUNT',
      payload: {
        id: accId,
        name: accName,
        type: accType,
        balance: '$0.00',
        status: 'Active'
      }
    });
    
    setIsModalOpen(false);
    setAccId('');
    setAccName('');
    setAccType('Asset');
    toast.success('Account successfully added!');
  };

  const tabs = ['Clients', 'Accounts', 'Classes', 'Locations', 'Entities'];

  return (
    <div className="page-container fade-in" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Master Data</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
            Maintain client-specific accounting master data used for accrual schedules and journal generation.
          </p>
        </div>
        <div className="badge-group" style={{ margin: 0 }}>
          {tabs.map(tab => (
            <button 
              key={tab}
              className={`badge ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>
      
      {activeTab === 'Accounts' ? (
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div className="data-toolbar">
          <input 
            type="text" 
            placeholder="Search accounts..." 
            className="search-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select 
            className="toolbar-select"
            defaultValue="CL002"
          >
            <option>CL001</option>
            <option>CL002</option>
            <option>CL003</option>
          </select>
          <div style={{ flex: 1 }}></div>
          <button className="btn-outline" style={{ marginRight: '8px' }} onClick={() => {
            const promise = () => new Promise((resolve) => setTimeout(resolve, 2000));
            toast.promise(promise, {
              loading: 'Syncing with QuickBooks Online...',
              success: 'Master Data successfully pulled from QBO!',
              error: 'Error syncing with QBO',
            });
          }}>Pull Master Data from QBO</button>
          <button className="btn-outline" style={{ marginRight: '8px' }} onClick={() => toast.success('Exporting Master Data to CSV...')}>Export</button>
          <button onClick={() => setIsModalOpen(true)} style={{ background: '#548f65', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer' }}>Add Account</button>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Client ID ▲</th>
              <th>Account Code</th>
              <th>Account Name ↕</th>
              <th>Account Type</th>
              <th>Sub-Type ↕</th>
              <th>Status ↕</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((acc, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text-muted)' }}>CL002</td>
                <td style={{ fontWeight: 500 }}>{acc.id}</td>
                <td>{acc.name}</td>
                <td style={{ color: 'var(--text-muted)' }}>{acc.type}</td>
                <td style={{ color: 'var(--text-muted)' }}>Current {acc.type}</td>
                <td><span style={{ color: '#059669', fontWeight: 500, fontSize: '0.85rem' }}>• {acc.status}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button style={{ padding: '4px 12px', border: '1px solid var(--border-light)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Edit</button>
                    <button style={{ padding: '4px 12px', border: '1px solid var(--border-light)', borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: '#e11d48' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No accounts found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-light)', padding: '64px 32px', textAlign: 'center' }}>
          <div className="empty-state">
            <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '16px' }}>🚧</div>
            <h3>{activeTab} Management</h3>
            <p className="text-muted" style={{ maxWidth: '400px', margin: '16px auto', lineHeight: '1.6' }}>
              The {activeTab.toLowerCase()} module is currently under development. 
              Please check back later or switch to the Accounts tab.
            </p>
            <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => setActiveTab('Accounts')}>
              Back to Accounts
            </button>
          </div>
        </div>
      )}


      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Account</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Account ID</label>
                  <input type="text" placeholder="e.g. 4000" value={accId} onChange={e => setAccId(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Account Name</label>
                  <input type="text" placeholder="e.g. Sales Revenue" value={accName} onChange={e => setAccName(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Account Type</label>
                <select value={accType} onChange={e => setAccType(e.target.value)}>
                  <option>Asset</option>
                  <option>Liability</option>
                  <option>Equity</option>
                  <option>Revenue</option>
                  <option>Expense</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary-sm" onClick={handleSaveAccount}>Save Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

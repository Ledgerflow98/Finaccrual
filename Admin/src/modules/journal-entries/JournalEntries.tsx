import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppState } from '../../context/AppContext';

export default function JournalEntries() {
  const { state, dispatch } = useAppState();
  const { journalEntries: entries } = state;

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Modal Form State
  const [description, setDescription] = useState('');
  const [debit, setDebit] = useState('');

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          entry.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Simple date filtering by checking if the formatted date includes the input date string
    // e.g. input is 2024-10-24. We just format it back to check. 
    let matchesDate = true;
    if (dateFilter) {
      const filterDateObj = new Date(dateFilter + 'T00:00:00');
      const formattedFilterDate = filterDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      matchesDate = entry.date === formattedFilterDate;
    }
    
    return matchesSearch && matchesDate;
  });

  const handlePostToQBO = () => {
    const promise = () => new Promise((resolve) => setTimeout(resolve, 1500));
    toast.promise(promise, {
      loading: 'Posting to QuickBooks Online...',
      success: 'Journal Entries posted successfully!',
      error: 'Error posting entries',
    });
    
    // Update local state to show them as posted
    dispatch({ type: 'POST_JOURNAL_ENTRIES' });
  };

  const handleSaveEntry = () => {
    if (!description || !debit) {
      toast.error('Description and amount are required');
      return;
    }
    
    const numAmount = parseFloat(debit.replace(/[^0-9.]/g, ''));
    const formattedAmount = `$${numAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    
    dispatch({
      type: 'ADD_JOURNAL_ENTRY',
      payload: {
        id: `JE-104${entries.length + 5}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        client: 'CL001 - Acme Corp',
        description,
        debit: formattedAmount,
        credit: formattedAmount,
        status: 'Draft'
      }
    });
    
    setIsModalOpen(false);
    setDescription('');
    setDebit('');
    toast.success('Journal Entry successfully saved as Draft!');
  };

  return (
    <div className="page-container fade-in" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Journal Entries</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
          View and generate journal entries.
        </p>
      </header>
      
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div className="data-toolbar">
          <input 
            type="text" 
            placeholder="Search entries..." 
            className="search-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <input 
            type="date" 
            className="search-input" 
            style={{ width: '150px' }} 
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
          <div style={{ flex: 1 }}></div>
          <button className="btn-outline" onClick={handlePostToQBO}>Post to QBO</button>
          <button className="btn-outline" onClick={() => toast.success('Exporting Journal Entries to Excel...')}>Export</button>
          <button className="btn-primary-sm" onClick={() => setIsModalOpen(true)}>New Entry</button>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Date ▼</th>
              <th>JE Number</th>
              <th>Client</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, i) => (
              <tr key={i}>
                <td>{entry.date}</td>
                <td style={{ fontWeight: 500 }}>{entry.id}</td>
                <td>{entry.client}</td>
                <td>{entry.description}</td>
                <td>{entry.debit}</td>
                <td>{entry.credit}</td>
                <td>
                  <span className={entry.status === 'Posted' ? 'status-active' : ''} style={{ color: entry.status === 'Draft' ? 'var(--primary)' : 'inherit', fontWeight: entry.status === 'Draft' ? 500 : 'normal' }}>
                    {entry.status}
                  </span>
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
              <h3>Create New Journal Entry</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Description</label>
                <input type="text" placeholder="e.g. Accrual" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden', marginTop: '16px' }}>
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
                      <td><input type="text" placeholder="Account name" style={{ border: 'none', outline: 'none', background: 'transparent' }}/></td>
                      <td><input type="number" placeholder="0.00" value={debit} onChange={e => setDebit(e.target.value)} style={{ width: '80px', border: 'none', background: 'transparent', outline: 'none' }} /></td>
                      <td><input type="number" placeholder="0.00" style={{ width: '80px', border: 'none', background: 'transparent', outline: 'none' }} disabled /></td>
                    </tr>
                    <tr>
                      <td><input type="text" placeholder="Account name" style={{ border: 'none', outline: 'none', background: 'transparent' }}/></td>
                      <td><input type="number" placeholder="0.00" style={{ width: '80px', border: 'none', background: 'transparent', outline: 'none' }} disabled /></td>
                      <td><input type="number" placeholder="0.00" value={debit} readOnly style={{ width: '80px', border: 'none', background: 'transparent', outline: 'none' }} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary-sm" onClick={handleSaveEntry}>Save Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

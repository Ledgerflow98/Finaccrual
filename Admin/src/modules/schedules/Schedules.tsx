import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppState } from '../../context/AppContext';

export default function Schedules() {
  const { state, dispatch } = useAppState();
  const { schedules } = state;

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('All Clients');

  // Modal Form State
  const [client, setClient] = useState('CL001 - Acme Corp');
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState('');

  const filteredSchedules = schedules.filter(sch => {
    const matchesSearch = sch.id.toLowerCase().includes(searchQuery.toLowerCase()) || sch.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClient = clientFilter === 'All Clients' || sch.client.includes(clientFilter);
    return matchesSearch && matchesClient;
  });

  const handleSaveSchedule = () => {
    if (!amount || !months) {
      toast.error('Amount and months are required');
      return;
    }
    
    const numAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    const numMonths = parseInt(months, 10);
    const accrual = numMonths > 0 ? (numAmount / numMonths).toFixed(2) : '0.00';
    
    dispatch({
      type: 'ADD_SCHEDULE',
      payload: {
        id: `SCH-2024-00${schedules.length + 1}`,
        client,
        amount: `$${numAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        months: numMonths.toString(),
        accrual: `$${parseFloat(accrual).toLocaleString(undefined, {minimumFractionDigits: 2})}`,
        status: 'Active'
      }
    });
    
    setIsModalOpen(false);
    setAmount('');
    setMonths('');
    toast.success('Schedule created successfully!');
  };

  return (
    <div className="page-container fade-in" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Schedules</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
          Accrual and amortization schedules.
        </p>
      </header>
      
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div className="data-toolbar">
          <input 
            type="text" 
            placeholder="Search schedules..." 
            className="search-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select 
            className="toolbar-select" 
            style={{ width: '120px' }}
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
          >
            <option>All Clients</option>
            <option>CL001</option>
            <option>CL002</option>
          </select>
          <div style={{ flex: 1 }}></div>
          <button className="btn-outline" onClick={() => toast.success('Schedules exported successfully!')}>Export</button>
          <button className="btn-primary-sm" onClick={() => setIsModalOpen(true)}>Create Schedule</button>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Schedule ID ▲</th>
              <th>Client</th>
              <th>Total Amount</th>
              <th>Months</th>
              <th>Monthly Accrual</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.map((sch, i) => (
              <tr key={i}>
                <td>{sch.id}</td>
                <td>{sch.client}</td>
                <td>{sch.amount}</td>
                <td>{sch.months}</td>
                <td>{sch.accrual}</td>
                <td>
                  <span className={sch.status === 'Active' ? 'status-active' : ''} style={{ color: sch.status === 'Completed' ? 'var(--text-muted)' : 'inherit' }}>
                    {sch.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}><button className="action-btn">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Schedule</h3>
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
                <label>Total Amount</label>
                <input type="number" placeholder="12000" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Duration (Months)</label>
                <input type="number" placeholder="12" value={months} onChange={e => setMonths(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary-sm" onClick={handleSaveSchedule}>Save Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

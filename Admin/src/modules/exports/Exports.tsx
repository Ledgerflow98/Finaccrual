import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppState } from '../../context/AppContext';

export default function Exports() {
  const { state, dispatch } = useAppState();
  const { exports } = state;

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Form State
  const [exportName, setExportName] = useState('');
  const [exportFormat, setExportFormat] = useState('Excel');

  const filteredExports = exports.filter(exp => 
    exp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    exp.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerateExport = () => {
    if (!exportName.trim()) {
      toast.error('Export name is required');
      return;
    }
    
    dispatch({
      type: 'ADD_EXPORT',
      payload: {
        id: `EXP-10${exports.length + 1}`,
        name: exportName,
        type: exportFormat === 'Excel (.xlsx)' ? 'Excel' : exportFormat === 'CSV (.csv)' ? 'CSV' : 'PDF',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Processing'
      }
    });
    
    setIsModalOpen(false);
    setExportName('');
    setExportFormat('Excel (.xlsx)');
    toast.success('Export generation started! This may take a moment.');
  };

  return (
    <div className="page-container fade-in" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Exports</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
          Export data and reports to various formats.
        </p>
      </header>
      
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <div className="data-toolbar">
          <input 
            type="text" 
            placeholder="Search exports..." 
            className="search-input" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select className="toolbar-select" style={{ width: '150px' }}>
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
            <option>This Year</option>
          </select>
          <div style={{ flex: 1 }}></div>
          <button className="btn-primary-sm" onClick={() => setIsModalOpen(true)}>New Export</button>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Export ID ▲</th>
              <th>Name</th>
              <th>Format</th>
              <th>Date Generated</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredExports.map((exp, i) => (
              <tr key={i}>
                <td>{exp.id}</td>
                <td style={{ fontWeight: 500 }}>{exp.name}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    background: exp.type === 'PDF' ? '#fee2e2' : exp.type === 'Excel' ? '#dcfce7' : '#e0e7ff',
                    color: exp.type === 'PDF' ? '#991b1b' : exp.type === 'Excel' ? '#166534' : '#3730a3'
                  }}>
                    {exp.type}
                  </span>
                </td>
                <td>{exp.date}</td>
                <td>
                  <span style={{ color: exp.status === 'Completed' ? '#10b981' : 'var(--primary)', fontWeight: 500 }}>
                    {exp.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    className="action-btn" 
                    disabled={exp.status === 'Processing'}
                    onClick={() => toast.success(`Downloading ${exp.name}...`)}
                  >
                    Download
                  </button>
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
              <h3>Create New Export</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Export Name</label>
                <input type="text" placeholder="e.g. Monthly Summary" value={exportName} onChange={e => setExportName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Data Source</label>
                <select>
                  <option>Journal Entries</option>
                  <option>Master Data</option>
                  <option>Schedules</option>
                </select>
              </div>
              <div className="form-group">
                <label>Format</label>
                <select value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
                  <option>Excel (.xlsx)</option>
                  <option>CSV (.csv)</option>
                  <option>PDF (.pdf)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary-sm" onClick={handleGenerateExport}>Generate Export</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

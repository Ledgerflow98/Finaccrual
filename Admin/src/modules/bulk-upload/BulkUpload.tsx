import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppState } from '../../context/AppContext';

export default function BulkUpload() {
  const { state, dispatch } = useAppState();
  const { uploads } = state;
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    toast.success(`Successfully uploaded ${file.name}`);
    
    dispatch({
      type: 'ADD_UPLOAD',
      payload: {
        name: file.name,
        status: 'Completed',
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
        rows: Math.floor(Math.random() * 500) + 10 // Mock row count
      }
    });
  };

  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="page-container fade-in" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Bulk Upload</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
          Import data in bulk using CSV or Excel files.
        </p>
      </header>
      
      <div style={{ display: 'grid', gap: '32px' }}>
        <div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{ 
            background: dragActive ? 'rgba(251, 146, 60, 0.05)' : 'white', 
            borderRadius: '12px', 
            border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-light)'}`, 
            padding: '48px', 
            textAlign: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          onClick={onBrowseClick}
        >
          <UploadCloud size={48} style={{ color: dragActive ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Drag & Drop your files here</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Supports .csv, .xls, and .xlsx up to 50MB</p>
          <button className="btn-primary-sm" onClick={e => { e.stopPropagation(); onBrowseClick(); }}>Browse Files</button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleChange} 
            style={{ display: 'none' }} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          />
        </div>

        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Uploads</h3>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Upload Date</th>
                <th>Rows Processed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((upload, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500 }}>
                      <FileText size={18} style={{ color: 'var(--primary)' }} />
                      {upload.name}
                    </div>
                  </td>
                  <td>{upload.date}</td>
                  <td>{upload.rows}</td>
                  <td>
                    {upload.status === 'Completed' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 500 }}>
                        <CheckCircle size={16} /> Completed
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 500 }}>
                        <XCircle size={16} /> Failed
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

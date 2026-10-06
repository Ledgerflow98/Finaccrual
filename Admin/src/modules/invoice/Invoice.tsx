import { useState } from 'react';
import { FileSpreadsheet, Plus, CheckCircle2, AlertCircle, Save, X } from 'lucide-react';

type FlowState = 'dashboard' | 'loading' | 'excel' | 'saving' | 'success';

export default function Invoice() {
  const [flowState, setFlowState] = useState<FlowState>('dashboard');
  const [invoiceDetails, setInvoiceDetails] = useState({ clientName: '', amount: '', description: '' });
  const [error, setError] = useState('');

  const handleStartFlow = () => {
    setFlowState('loading');
    setTimeout(() => {
      setFlowState('excel');
    }, 1500); // Simulate Office.js opening Excel
  };

  const handleValidateAndSave = () => {
    if (!invoiceDetails.clientName || !invoiceDetails.amount || !invoiceDetails.description) {
      setError('Please fill in all invoice details.');
      return;
    }
    
    if (isNaN(Number(invoiceDetails.amount))) {
      setError('Amount must be a valid number.');
      return;
    }

    setError('');
    setFlowState('saving');
    
    setTimeout(() => {
      // Simulate reading Excel data via Office.js API and saving to ERP
      setFlowState('success');
      
      setTimeout(() => {
        setFlowState('dashboard');
        setInvoiceDetails({ clientName: '', amount: '', description: '' });
      }, 2500);
    }, 2000);
  };

  return (
    <div className="page-container fade-in relative h-full">
      
      {/* Toast Notification for Success */}
      {flowState === 'success' && (
        <div className="toast-success fade-in">
          <CheckCircle2 size={24} />
          <span>Invoice Saved Successfully! Returning to Dashboard...</span>
        </div>
      )}

      {/* Main Invoice Dashboard */}
      <header className="page-header">
        <div>
          <h1>Invoices</h1>
          <p className="subtitle">Manage and track all your invoices.</p>
        </div>
        <button className="btn-primary flex-center gap-2" onClick={handleStartFlow} disabled={flowState !== 'dashboard'}>
          <Plus size={20} />
          Add Invoice
        </button>
      </header>
      
      {flowState === 'dashboard' && (
        <div className="glass-card full-width">
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No invoices yet</h3>
            <p>Click "Add Invoice" to open the Excel template and create your first invoice.</p>
          </div>
        </div>
      )}

      {/* Office.js Loading Screen */}
      {flowState === 'loading' && (
        <div className="glass-card full-width flex-col-center">
          <div className="spinner mb-4"></div>
          <h3>Connecting to Office.js...</h3>
          <p className="text-muted">Opening Microsoft Excel template</p>
        </div>
      )}

      {/* Saving Screen */}
      {flowState === 'saving' && (
        <div className="glass-card full-width flex-col-center">
          <div className="spinner mb-4"></div>
          <h3>Reading Data via Office.js...</h3>
          <p className="text-muted">Validating and saving invoice to ERP</p>
        </div>
      )}

      {/* Simulated Excel Interface Overlay */}
      {flowState === 'excel' && (
        <div className="mock-excel-overlay fade-in">
          <div className="mock-excel-header">
            <div className="excel-title">
              <FileSpreadsheet size={20} className="excel-green" />
              <span>Invoice_Template.xlsx - Excel (Simulated Office.js Environment)</span>
            </div>
            <button className="icon-btn-light" onClick={() => setFlowState('dashboard')}>
              <X size={20} />
            </button>
          </div>
          
          <div className="mock-excel-toolbar">
            <button className="toolbar-btn active">Home</button>
            <button className="toolbar-btn">Insert</button>
            <button className="toolbar-btn">Formulas</button>
            <button className="toolbar-btn">Data</button>
          </div>

          <div className="mock-excel-body">
            <div className="worksheet">
              <div className="cell-header row-number"></div>
              <div className="cell-header">A</div>
              <div className="cell-header">B</div>
              <div className="cell-header">C</div>

              <div className="cell row-number">1</div>
              <div className="cell label-cell font-bold text-lg" style={{ gridColumn: 'span 2' }}>INVOICE TEMPLATE</div>
              <div className="cell"></div>

              <div className="cell row-number">2</div>
              <div className="cell"></div>
              <div className="cell"></div>
              <div className="cell"></div>

              <div className="cell row-number">3</div>
              <div className="cell label-cell">Client Name:</div>
              <div className="cell input-cell">
                <input 
                  type="text" 
                  value={invoiceDetails.clientName}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, clientName: e.target.value})}
                  placeholder="Enter client name"
                  autoFocus
                />
              </div>
              <div className="cell"></div>

              <div className="cell row-number">4</div>
              <div className="cell label-cell">Description:</div>
              <div className="cell input-cell">
                <input 
                  type="text" 
                  value={invoiceDetails.description}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, description: e.target.value})}
                  placeholder="Enter services rendered"
                />
              </div>
              <div className="cell"></div>

              <div className="cell row-number">5</div>
              <div className="cell label-cell">Amount ($):</div>
              <div className="cell input-cell">
                <input 
                  type="number" 
                  value={invoiceDetails.amount}
                  onChange={(e) => setInvoiceDetails({...invoiceDetails, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="cell"></div>

            </div>

            {/* ERP Side Pane Add-in */}
            <div className="office-add-in-pane">
              <div className="pane-header">
                ERP Sync Add-in
              </div>
              <div className="pane-body">
                <p>Fill out the template cells on the left. When finished, validate and save back to the ERP.</p>
                
                {error && (
                  <div className="error-box">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <button className="btn-primary excel-btn w-full flex-center gap-2 mt-4" onClick={handleValidateAndSave}>
                  <Save size={18} />
                  Validate & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import { 
  Users, Calendar, FileText, Database, 
  ArrowUpRight, ArrowDownRight, PlusCircle, UploadCloud, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import { useAppState } from '../../context/AppContext';
import { toast } from 'sonner';

export default function Dashboard() {
  const { state } = useAppState();
  
  // Calculate dynamic stats from global state
  const totalClients = state.clients?.length || 0;
  const activeSchedules = state.schedules?.length || 0;
  const journalEntries = state.journalEntries?.length || 0;
  const uploads = state.uploads?.length || 0;

  const handleQuickAction = (action: string) => {
    toast.success(`Action Triggered: ${action}`);
  };

  return (
    <div className="page-container fade-in" style={{ padding: '24px 0' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '8px' }}>Here's what's happening with your accounts today.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-outline" onClick={() => handleQuickAction('Sync Data')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> Sync QBO
          </button>
          <button className="btn-primary-sm" onClick={() => handleQuickAction('New Entry')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={16} /> New Entry
          </button>
        </div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        {/* Stat Card 1 */}
        <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-light)' }}>
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 className="stat-title" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Active Clients</h3>
            <div className="stat-icon" style={{ background: '#e0e7ff', color: 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
              <Users size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalClients}</div>
          <div className="stat-change positive" style={{ color: '#10b981', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
            <ArrowUpRight size={16} /> <span>12% from last month</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-light)' }}>
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 className="stat-title" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Active Schedules</h3>
            <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534', padding: '8px', borderRadius: '8px' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 700 }}>{activeSchedules}</div>
          <div className="stat-change positive" style={{ color: '#10b981', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
            <ArrowUpRight size={16} /> <span>8 new this week</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-light)' }}>
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 className="stat-title" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Journal Entries</h3>
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309', padding: '8px', borderRadius: '8px' }}>
              <FileText size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 700 }}>{journalEntries}</div>
          <div className="stat-change negative" style={{ color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
            <ArrowDownRight size={16} /> <span>Needs review</span>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-light)' }}>
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 className="stat-title" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Data Uploads</h3>
            <div className="stat-icon" style={{ background: '#fee2e2', color: '#991b1b', padding: '8px', borderRadius: '8px' }}>
              <Database size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 700 }}>{uploads}</div>
          <div className="stat-change positive" style={{ color: '#10b981', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
            <ArrowUpRight size={16} /> <span>All systems synced</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 style={{ fontSize: '1.25rem', margin: '0 0 24px 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { time: '10 mins ago', user: 'Jane Doe', action: 'posted Journal Entry JE-1045', type: 'entry' },
              { time: '2 hours ago', user: 'System', action: 'completed bulk upload of Q3_Expenses.csv', type: 'upload' },
              { time: 'Yesterday', user: 'Your Name Smith', action: 'added a new client: Initech', type: 'client' },
              { time: 'Yesterday', user: 'Jane Doe', action: 'exported Monthly Accrual Schedule', type: 'export' }
            ].map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: 'var(--primary)', 
                  marginTop: '6px' 
                }}></div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{log.user}</span> {log.action}
                  </p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px 0' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button className="btn-outline" onClick={() => handleQuickAction('Upload Files')} style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: 'auto' }}>
                <UploadCloud size={20} />
                <span style={{ fontSize: '0.85rem' }}>Upload</span>
              </button>
              <button className="btn-outline" onClick={() => handleQuickAction('Excel Integration')} style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: 'auto' }}>
                <FileSpreadsheet size={20} />
                <span style={{ fontSize: '0.85rem' }}>Excel Sync</span>
              </button>
            </div>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, #1e1b4b 100%)', borderRadius: '12px', padding: '24px', color: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 8px 0', color: 'white' }}>Pro Tip</h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Use the Master Data page to automatically sync your chart of accounts with QuickBooks Online.
            </p>
            <button style={{ background: 'white', color: 'var(--secondary)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

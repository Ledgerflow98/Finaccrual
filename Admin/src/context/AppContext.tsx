import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';

// Interfaces for our Data Models
export interface Client {
  id: string;
  name: string;
  contact: string;
  plan: string;
  status: string;
}

export interface Schedule {
  id: string;
  client: string;
  amount: string;
  months: string;
  accrual: string;
  status: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: string;
  status: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  client: string;
  description: string;
  debit: string;
  credit: string;
  status: string;
}

export interface ExportData {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
}

export interface Workpaper {
  id: string;
  client: string;
  period: string;
  preparer: string;
  status: string;
}

export interface Upload {
  name: string;
  status: string;
  date: string;
  rows: number;
}

export interface AppState {
  isAuthenticated: boolean;
  user: { name: string; email: string } | null;
  clients: Client[];
  schedules: Schedule[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  exports: ExportData[];
  workpapers: Workpaper[];
  uploads: Upload[];
}

// Check localStorage for existing session
const savedToken = localStorage.getItem('token');
const savedUser = localStorage.getItem('user');

let initialAuth = false;
let initialUser = null;

if (savedToken && savedUser) {
  try {
    initialUser = JSON.parse(savedUser);
    initialAuth = true;
  } catch(e) {
    console.error('Error parsing user from localStorage', e);
  }
}

// Initial Monolithic State
const initialState: AppState = {
  isAuthenticated: initialAuth,
  user: initialUser,
  clients: [
    { id: 'CL001', name: 'Acme Corp', contact: 'Your Name@acme.com', plan: 'QBO Advanced', status: 'Active' },
    { id: 'CL002', name: 'Globex Inc', contact: 'sarah@globex.com', plan: 'QBO Plus', status: 'Active' },
    { id: 'CL003', name: 'Initech', contact: 'bill@initech.com', plan: 'Xero Standard', status: 'Pending' }
  ],
  schedules: [
    { id: 'SCH-2024-001', client: 'CL001 - Acme Corp', amount: '$12,000.00', months: '12', accrual: '$1,000.00', status: 'Active' },
    { id: 'SCH-2024-002', client: 'CL001 - Acme Corp', amount: '$6,000.00', months: '6', accrual: '$1,000.00', status: 'Active' },
    { id: 'SCH-2024-003', client: 'CL002 - Globex Inc', amount: '$24,000.00', months: '24', accrual: '$1,000.00', status: 'Draft' }
  ],
  accounts: [
    { id: '1000', name: 'Cash and Cash Equivalents', type: 'Asset', balance: '$124,500.00', status: 'Active' },
    { id: '1200', name: 'Accounts Receivable', type: 'Asset', balance: '$45,200.00', status: 'Active' },
    { id: '2000', name: 'Accounts Payable', type: 'Liability', balance: '$12,400.00', status: 'Active' },
    { id: '3000', name: 'Owner Equity', type: 'Equity', balance: '$157,300.00', status: 'Active' }
  ],
  journalEntries: [
    { id: 'JE-1045', date: 'Oct 24, 2024', client: 'CL001 - Acme Corp', description: 'Monthly Rent Accrual', debit: '$1,000.00', credit: '$1,000.00', status: 'Posted' },
    { id: 'JE-1046', date: 'Oct 24, 2024', client: 'CL002 - Globex Inc', description: 'Prepaid Insurance Amortization', debit: '$900.00', credit: '$900.00', status: 'Draft' }
  ],
  exports: [
    { id: 'EXP-101', name: 'Q3 Financial Summary', type: 'PDF', date: 'Oct 24, 2024', status: 'Completed' },
    { id: 'EXP-102', name: 'Vendor Payments YTD', type: 'Excel', date: 'Oct 23, 2024', status: 'Completed' },
    { id: 'EXP-103', name: 'Accrual Schedule - Oct', type: 'CSV', date: 'Oct 24, 2024', status: 'Processing' }
  ],
  workpapers: [
    { id: 'WP-24-09', client: 'CL001 - Acme Corp', period: 'Sep 2024', preparer: 'Jane Doe', status: 'Approved' },
    { id: 'WP-24-10', client: 'CL001 - Acme Corp', period: 'Oct 2024', preparer: 'Your Name Smith', status: 'Pending Review' },
    { id: 'WP-24-10', client: 'CL002 - Globex Inc', period: 'Oct 2024', preparer: 'Alice Your Nameson', status: 'In Progress' }
  ],
  uploads: [
    { name: 'Q3_Journal_Entries_Batch1.csv', status: 'Completed', date: 'Oct 24, 2024, 14:32', rows: 245 },
    { name: 'Updated_Chart_of_Accounts.xlsx', status: 'Failed', date: 'Oct 23, 2024, 09:15', rows: 0 }
  ]
};

// Actions
export type Action =
  | { type: 'LOGIN'; payload: { name: string; email: string } }
  | { type: 'LOGOUT' }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'ADD_SCHEDULE'; payload: Schedule }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'ADD_JOURNAL_ENTRY'; payload: JournalEntry }
  | { type: 'POST_JOURNAL_ENTRIES' }
  | { type: 'ADD_EXPORT'; payload: ExportData }
  | { type: 'ADD_WORKPAPER'; payload: Workpaper }
  | { type: 'ADD_UPLOAD'; payload: Upload };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isAuthenticated: true, user: action.payload };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'ADD_SCHEDULE':
      return { ...state, schedules: [action.payload, ...state.schedules] };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload].sort((a, b) => a.id.localeCompare(b.id)) };
    case 'ADD_JOURNAL_ENTRY':
      return { ...state, journalEntries: [action.payload, ...state.journalEntries] };
    case 'POST_JOURNAL_ENTRIES':
      return { 
        ...state, 
        journalEntries: state.journalEntries.map(e => ({ ...e, status: 'Posted' })) 
      };
    case 'ADD_EXPORT':
      return { ...state, exports: [action.payload, ...state.exports] };
    case 'ADD_WORKPAPER':
      return { ...state, workpapers: [action.payload, ...state.workpapers] };
    case 'ADD_UPLOAD':
      return { ...state, uploads: [action.payload, ...state.uploads] };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppState() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}

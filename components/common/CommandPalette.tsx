
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm } from '../../hooks/useCrm';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = {
  id: string;
  type: 'lead' | 'customer' | 'page' | 'action';
  title: string;
  subtitle?: string;
  icon: string;
  action: () => void;
  tag?: string;
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();
  const { leads, customers, openLeadModal, openInvoiceModal } = useCrm();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
        setQuery('');
        setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredResults = useMemo(() => {
    if (!query) return [];

    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // 1. Pages Navigation
    const pages = [
      { name: 'Dashboard', path: '/', icon: 'ri-dashboard-line' },
      { name: 'Leads', path: '/leads', icon: 'ri-group-line' },
      { name: 'Customers', path: '/customers', icon: 'ri-team-line' },
      { name: 'Invoices', path: '/invoices', icon: 'ri-file-list-3-line' },
      { name: 'Settings', path: '/settings', icon: 'ri-settings-3-line' },
      { name: 'Reminders', path: '/reminders', icon: 'ri-notification-3-line' },
    ];

    pages.forEach(page => {
      if (page.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: `page-${page.name}`,
          type: 'page',
          title: page.name,
          subtitle: 'Go to page',
          icon: page.icon,
          action: () => navigate(page.path),
        });
      }
    });

    // 2. Actions
    if ('create lead'.includes(lowerQuery) || 'add lead'.includes(lowerQuery)) {
        results.push({
            id: 'action-create-lead',
            type: 'action',
            title: 'Create New Lead',
            subtitle: 'Action',
            icon: 'ri-user-add-line',
            action: () => openLeadModal(null)
        });
    }
    if ('create invoice'.includes(lowerQuery) || 'add invoice'.includes(lowerQuery)) {
        results.push({
            id: 'action-create-invoice',
            type: 'action',
            title: 'Create New Invoice',
            subtitle: 'Action',
            icon: 'ri-file-add-line',
            action: () => openInvoiceModal(null)
        });
    }

    // 3. Leads
    leads.forEach(lead => {
      if (lead.name.toLowerCase().includes(lowerQuery) || lead.phone.includes(lowerQuery)) {
        results.push({
          // FIX: Cast lead.id to string
          id: String(lead.id),
          type: 'lead',
          title: lead.name,
          subtitle: `${lead.phone} • ${lead.leadStatus}`,
          icon: 'ri-user-star-line',
          tag: 'Lead',
          action: () => navigate(`/leads/${lead.id}`),
        });
      }
    });

    // 4. Customers
    customers.forEach(cust => {
      if (cust.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          // FIX: Cast cust.id to string
          id: String(cust.id),
          type: 'customer',
          title: cust.name,
          subtitle: `${cust.serviceType}`,
          icon: 'ri-briefcase-line',
          tag: 'Customer',
          action: () => navigate(`/customers`), // Ideally navigate to detail if exists
        });
      }
    });

    return results.slice(0, 10); // Limit to 10 results
  }, [query, leads, customers, navigate, openLeadModal, openInvoiceModal]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          filteredResults[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"></div>

      {/* Palette Window */}
      <div 
        className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5 transform transition-all scale-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center border-b border-gray-100 px-4 py-3 bg-gray-50/50">
          <i className="ri-search-line text-gray-400 text-xl mr-3"></i>
          <input
            ref={inputRef}
            type="text"
            className="flex-grow bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-lg h-10"
            placeholder="What are you looking for?"
            value={query}
            onChange={e => {
                setQuery(e.target.value);
                setSelectedIndex(0);
            }}
          />
          <div className="flex items-center space-x-2">
             <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5">ESC</span>
          </div>
        </div>

        {/* Results List */}
        {filteredResults.length > 0 ? (
          <ul ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
            {filteredResults.map((result, index) => (
              <li
                key={result.id}
                onClick={() => {
                  result.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`px-4 py-3 mx-2 rounded-lg cursor-pointer flex items-center transition-colors group ${
                  index === selectedIndex ? 'bg-primary/5' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mr-3 text-lg flex-shrink-0 transition-colors ${
                    index === selectedIndex ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                }`}>
                  <i className={result.icon}></i>
                </div>
                <div className="flex-grow min-w-0">
                  <div className={`font-medium ${index === selectedIndex ? 'text-gray-900' : 'text-gray-700'}`}>
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-gray-400 truncate">
                      {result.subtitle}
                    </div>
                  )}
                </div>
                {result.tag && (
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 mr-2">{result.tag}</span>
                )}
                {index === selectedIndex && (
                    <i className="ri-arrow-right-line text-primary"></i>
                )}
              </li>
            ))}
          </ul>
        ) : query ? (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <i className="ri-search-eye-line text-3xl text-gray-400"></i>
            </div>
            <p className="text-gray-600 font-medium">No results found</p>
            <p className="text-sm text-gray-400 mt-1">We couldn't find anything matching "{query}"</p>
          </div>
        ) : (
          <div className="p-12 text-center">
             <p className="text-gray-400 text-sm">Type to search leads, customers, or run commands.</p>
             <div className="flex justify-center gap-4 mt-4">
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Search Leads</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Go to Settings</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Create Invoice</span>
             </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="bg-gray-50 px-4 py-2 text-xs text-gray-400 flex justify-between items-center border-t border-gray-100">
            <div className="flex items-center gap-4">
                <span className="flex items-center"><i className="ri-arrow-up-line mr-1"></i><i className="ri-arrow-down-line mr-1"></i> to navigate</span>
                <span className="flex items-center"><i className="ri-corner-down-left-line mr-1"></i> to select</span>
            </div>
            <span>Lumina CRM</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

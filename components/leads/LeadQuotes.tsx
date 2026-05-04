
import React from 'react';
import { useCrm } from '../../hooks/useCrm';
import { Lead, QuoteStatus, Quote } from '../../types';

const getStatusClass = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.ACCEPTED: return 'bg-green-100 text-green-800 border-green-200';
      case QuoteStatus.SENT: return 'bg-blue-100 text-blue-800 border-blue-200';
      case QuoteStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-200';
      case QuoteStatus.DRAFT:
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const LeadQuotes: React.FC<{ lead: Lead }> = ({ lead }) => {
    const { getQuotesForLead, openQuoteBuilder } = useCrm();
    
    // Casting ID to string for safe comparison in getQuotesForLead selector
    const quotes = getQuotesForLead(String(lead.id));

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                    <h3 className="text-sm font-bold text-gray-800">Quotation History</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Manage professional travel quotes for this lead</p>
                </div>
                <button 
                    onClick={() => openQuoteBuilder(String(lead.id))} 
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                    <i className="ri-add-line text-sm"></i> CREATE QUOTE
                </button>
            </div>

            <div className="space-y-4">
                {quotes.length > 0 ? quotes.map((quote: Quote) => (
                    <div key={quote.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <i className="ri-file-list-3-line text-xl"></i>
                                </div>
                                <div>
                                    <button 
                                        onClick={() => openQuoteBuilder(String(lead.id), quote)} 
                                        className="font-bold text-gray-900 hover:text-primary transition-colors text-sm"
                                    >
                                        {quote.quoteNumber}
                                    </button>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Issued: {formatDate(quote.createdAt)}</p>
                                </div>
                            </div>
                             <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${getStatusClass(quote.status)}`}>
                                {quote.status}
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-50">
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Total Amount</p>
                                <p className="text-lg font-black text-gray-800">₹{Number(quote.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Valid Until</p>
                                <p className={`text-xs font-semibold ${new Date(quote.validUntil) < new Date() ? 'text-red-500' : 'text-gray-600'}`}>
                                    {formatDate(quote.validUntil)}
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                             <button 
                                onClick={() => openQuoteBuilder(String(lead.id), quote)}
                                className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                             >
                                <i className="ri-edit-line mr-1"></i> EDIT
                             </button>
                             <button className="text-[10px] font-bold text-gray-500 hover:bg-gray-100 px-2 py-1 rounded transition-colors">
                                <i className="ri-printer-line mr-1"></i> PRINT
                             </button>
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <i className="ri-price-tag-3-line text-3xl text-gray-300"></i>
                        </div>
                        <p className="text-sm font-semibold text-gray-600">No quotes created yet.</p>
                        <p className="text-xs mt-1">Generate a professional quote for your prospect in seconds.</p>
                        <button 
                            onClick={() => openQuoteBuilder(String(lead.id))}
                            className="mt-6 px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            + Start New Quote
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadQuotes;

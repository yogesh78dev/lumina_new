
import React, { useState, useEffect } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { Quote, QuoteItem, QuoteStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { useSwal } from '../../hooks/useSwal';

const QuoteBuilderModal: React.FC = () => {
    const {
        isQuoteBuilderOpen,
        closeQuoteBuilder,
        editingQuote,
        addQuote,
        updateQuote,
        currentLeadIdForQuote,
    } = useCrm();
    const { fireToast } = useSwal();

    const getInitialQuote = (): Omit<Quote, 'id' | 'leadId' | 'quoteNumber'> => ({
        createdAt: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: QuoteStatus.DRAFT,
        items: [{ id: uuidv4(), description: '', quantity: 1, price: 0, total: 0 }],
        subtotal: 0,
        tax: 10, // Default 10% tax
        total: 0,
    });
    
    const [quoteData, setQuoteData] = useState<Partial<Quote>>(getInitialQuote());

    useEffect(() => {
        if (isQuoteBuilderOpen) {
            if (editingQuote) {
                setQuoteData({
                    ...editingQuote,
                    createdAt: editingQuote.createdAt.split('T')[0],
                    validUntil: editingQuote.validUntil.split('T')[0],
                });
            } else {
                setQuoteData(getInitialQuote());
            }
        }
    }, [isQuoteBuilderOpen, editingQuote]);
    
    useEffect(() => {
        // Recalculate totals whenever items or tax change
        const items = quoteData.items || [];
        const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
        const taxAmount = subtotal * ((quoteData.tax || 0) / 100);
        const total = subtotal + taxAmount;
        
        // Prevent infinite loop by only updating if values actually changed
        if (subtotal !== quoteData.subtotal || total !== quoteData.total) {
            setQuoteData(prev => ({...prev, subtotal, total}));
        }
    }, [quoteData.items, quoteData.tax, quoteData.subtotal, quoteData.total]);


    if (!isQuoteBuilderOpen) return null;

    const handleItemChange = (itemId: string | number, field: keyof QuoteItem, value: any) => {
        const newItems = (quoteData.items || []).map(item => {
            if (String(item.id) === String(itemId)) {
                const newItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'price') {
                    newItem.total = (newItem.quantity || 0) * (newItem.price || 0);
                }
                return newItem;
            }
            return item;
        });
        setQuoteData(prev => ({...prev, items: newItems}));
    };
    
    const handleAddItem = () => {
        const newItem: QuoteItem = { id: uuidv4(), description: '', quantity: 1, price: 0, total: 0 };
        setQuoteData(prev => ({...prev, items: [...(prev.items || []), newItem]}));
    };
    
    const handleRemoveItem = (itemId: string | number) => {
        if (quoteData.items && quoteData.items.length > 1) {
             setQuoteData(prev => ({...prev, items: prev.items?.filter(item => String(item.id) !== String(itemId))}));
        }
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setQuoteData(prev => ({...prev, [name]: name === 'tax' ? parseFloat(value) : value }));
    };

    const handleSubmit = async () => {
        if (!currentLeadIdForQuote) return;
        
        // Simple Validation
        if ((quoteData.items || []).some(item => !item.description.trim() || item.price <= 0)) {
            fireToast('warning', 'Please complete all line items with valid descriptions and prices.');
            return;
        }

        try {
            if (editingQuote) {
                await updateQuote(quoteData as Quote);
                fireToast('success', 'Quote updated successfully!');
            } else {
                await addQuote(currentLeadIdForQuote, quoteData as Omit<Quote, 'id' | 'leadId' | 'quoteNumber'>);
                fireToast('success', 'New Quote created successfully!');
            }
            closeQuoteBuilder();
        } catch (error) {
            fireToast('error', 'Failed to save quote. Please try again.');
        }
    };

    const handleDownload = () => {
        fireToast('info', 'Generating and downloading Quote PDF...');
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4" onClick={closeQuoteBuilder}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h3 className="text-xl font-semibold">{editingQuote ? `Edit Quote ${editingQuote.quoteNumber}` : 'Create New Quote'}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Professional quotation for travel services</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {editingQuote && (
                            <button onClick={handleDownload} className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all mr-2" title="Download PDF">
                                <i className="ri-download-line text-xl"></i>
                            </button>
                        )}
                        <button onClick={closeQuoteBuilder} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-all">
                            <i className="ri-close-line text-2xl"></i>
                        </button>
                    </div>
                </div>
                <div className="flex-grow p-6 overflow-y-auto space-y-6 bg-gray-50/30">
                    {/* Header Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Issue Date</label>
                            <input type="date" name="createdAt" value={quoteData.createdAt || ''} onChange={handleFieldChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valid Until</label>
                            <input type="date" name="validUntil" value={quoteData.validUntil || ''} onChange={handleFieldChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Status</label>
                            <select name="status" value={quoteData.status} onChange={handleFieldChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm">
                                {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Qty</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-36">Rate (₹)</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-36">Amount (₹)</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {quoteData.items?.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-2"><input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} placeholder="e.g. Dubai 30 Days Single Entry Visa" className="w-full bg-transparent border-0 focus:ring-0 text-sm placeholder-gray-300"/></td>
                                        <td className="p-2"><input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))} className="w-full bg-transparent border-0 focus:ring-0 text-sm text-center"/></td>
                                        <td className="p-2">
                                            <div className="relative">
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                                <input type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value))} className="w-full bg-transparent border-0 focus:ring-0 text-sm pl-4"/>
                                            </div>
                                        </td>
                                        <td className="p-2 font-semibold text-gray-700">₹{(item.total || 0).toLocaleString()}</td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="ri-delete-bin-line"></i></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 bg-gray-50/50 border-t">
                            <button onClick={handleAddItem} className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                                <i className="ri-add-circle-line text-lg"></i> ADD LINE ITEM
                            </button>
                        </div>
                    </div>

                    {/* Totals Section */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-sm bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">Subtotal</span>
                                <span className="text-gray-800 font-bold">₹{(quoteData.subtotal || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <label className="text-gray-500 font-medium">Tax (%)</label>
                                <input type="number" name="tax" value={quoteData.tax} onChange={handleFieldChange} className="w-20 text-right rounded-lg border-gray-200 text-sm p-1" />
                            </div>
                            <div className="flex justify-between items-center border-t border-dashed pt-4">
                                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                <span className="text-2xl font-black text-primary">₹{(quoteData.total || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end p-4 border-t bg-gray-50 space-x-3">
                    <button onClick={closeQuoteBuilder} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 text-sm transition-all shadow-sm">Cancel</button>
                    <button onClick={handleSubmit} className="px-8 py-2 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary/90 transition-all shadow-md active:scale-95">{editingQuote ? 'Update and Save' : 'Generate Quote'}</button>
                </div>
            </div>
        </div>
    );
};

export default QuoteBuilderModal;

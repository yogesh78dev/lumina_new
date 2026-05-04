
import React, { useState, useRef } from 'react';
import { Lead, DocumentStatus, LeadDocument } from '../../types';
import { useCrm } from '../../hooks/useCrm';
import { useSwal } from '../../hooks/useSwal';

interface LeadDocumentsProps {
    lead: Lead;
}

const getStatusClass = (status: DocumentStatus) => {
    switch (status) {
        case DocumentStatus.VERIFIED: return 'bg-green-100 text-green-800 border-green-200';
        case DocumentStatus.UPLOADED: return 'bg-blue-100 text-blue-800 border-blue-200';
        case DocumentStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-200';
        case DocumentStatus.PENDING:
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const LeadDocuments: React.FC<LeadDocumentsProps> = ({ lead }) => {
    const { getDocumentsForLead, addDocumentForLead, updateDocumentStatus, deleteDocumentForLead, documentTypes } = useCrm();
    const { fireToast, confirmDelete } = useSwal();
    const [newDocName, setNewDocName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [docToUploadId, setDocToUploadId] = useState<string | number | null>(null);

    const documents = getDocumentsForLead(String(lead.id));

    const handleAddDocument = async (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) return;

        if (documents.some(doc => doc.name.toLowerCase() === trimmedName.toLowerCase())) {
            fireToast('warning', `Document "${trimmedName}" already exists.`);
            return;
        }

        try {
            await addDocumentForLead(String(lead.id), trimmedName);
            setNewDocName('');
            fireToast('success', 'Document placeholder added');
        } catch (error) {
            fireToast('error', 'Failed to add document');
        }
    };

    const handleDeleteDocument = async (docId: string | number, docName: string) => {
        const result = await confirmDelete({
            title: 'Remove Document?',
            html: `Are you sure you want to remove <strong>${docName}</strong>?`,
            confirmButtonText: 'Yes, remove'
        });

        if (result) {
            try {
                await deleteDocumentForLead(String(lead.id), docId);
                fireToast('success', 'Document removed');
            } catch (error) {
                fireToast('error', 'Failed to delete document');
            }
        }
    };

    const handleStatusChange = async (docId: string | number, newStatus: DocumentStatus) => {
        try {
            await updateDocumentStatus(String(lead.id), docId, newStatus);
            fireToast('success', `Status updated to ${newStatus}`);
        } catch (error) {
            fireToast('error', 'Failed to update status');
        }
    };
    
    const triggerFileUpload = (docId: string | number) => {
        setDocToUploadId(docId);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && docToUploadId) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = async (event) => {
                const base64String = event.target?.result as string;
                try {
                    // Send actual file data to backend
                    await updateDocumentStatus(
                        String(lead.id), 
                        docToUploadId, 
                        DocumentStatus.UPLOADED, 
                        file.name, 
                        file.type, 
                        base64String
                    );
                    setDocToUploadId(null);
                    e.target.value = ''; // Reset file input
                    fireToast('success', `"${file.name}" uploaded and saved successfully`);
                } catch (error) {
                    fireToast('error', 'Failed to save file data');
                }
            };

            reader.onerror = () => {
                fireToast('error', 'Failed to read file');
            };

            reader.readAsDataURL(file);
        }
    };

    const handleViewDocument = (doc: LeadDocument) => {
        if (!doc.fileData) {
            fireToast('error', 'No file content available to view');
            return;
        }

        try {
            // Attempt to open in a new tab if it's an image or PDF
            const isViewable = doc.fileType?.includes('image') || doc.fileType?.includes('pdf');
            
            if (isViewable) {
                const newWindow = window.open();
                if (newWindow) {
                    newWindow.document.write(`<iframe src="${doc.fileData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                    newWindow.document.title = doc.fileName || doc.name;
                } else {
                    fireToast('error', 'Pop-up blocked. Please allow pop-ups for this site.');
                }
            } else {
                // Trigger download for other types
                const link = document.createElement('a');
                link.href = doc.fileData;
                link.download = doc.fileName || doc.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            fireToast('error', 'Failed to open document');
        }
    };


    return (
        <div>
            {/* Add Custom Document */}
            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDocument(newDocName)}
                    placeholder="Type document name..."
                    className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5 bg-gray-50 focus:bg-white transition-colors"
                />
                <button 
                    onClick={() => handleAddDocument(newDocName)} 
                    disabled={!newDocName.trim()}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-md hover:bg-black text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Add
                </button>
            </div>

            {/* Predefined List */}
            <div className="mb-6 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Add Documents:</p>
                <div className="flex flex-wrap gap-2">
                    {documentTypes.map(docType => {
                        const exists = documents.some(d => d.name.toLowerCase() === docType.name.toLowerCase());
                        return (
                            <button 
                                key={docType.id} 
                                onClick={() => handleAddDocument(docType.name)} 
                                disabled={exists}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1 ${
                                    exists 
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary hover:shadow-sm'
                                }`}
                            >
                                {exists ? <i className="ri-check-line"></i> : <i className="ri-add-line"></i>}
                                {docType.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Document List */}
            <div className="space-y-3">
                {documents.length > 0 ? documents.map(doc => (
                    <div key={doc.id} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                             <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.fileName ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
                                     <i className={`${doc.fileName ? 'ri-file-pdf-fill' : 'ri-file-unknow-line'} text-xl`}></i>
                                 </div>
                                 <div>
                                     <p className="text-gray-800 text-sm font-semibold">{doc.name}</p>
                                     {doc.fileName ? (
                                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                            <i className="ri-attachment-line"></i> {doc.fileName}
                                        </p>
                                     ) : (
                                        <p className="text-xs text-gray-400 italic mt-0.5">No file attached</p>
                                     )}
                                 </div>
                             </div>

                             <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded border ${getStatusClass(doc.status as DocumentStatus)} cursor-pointer flex items-center gap-1`}>
                                        {doc.status} <i className="ri-arrow-down-s-line"></i>
                                    </span>
                                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none group-hover:pointer-events-auto overflow-hidden">
                                        {Object.values(DocumentStatus).map(s => (
                                            <button 
                                                key={s} 
                                                onClick={() => handleStatusChange(doc.id, s as DocumentStatus)} 
                                                className={`block w-full text-left px-4 py-2 text-xs hover:bg-gray-50 ${s === doc.status ? 'bg-gray-50 font-bold text-primary' : 'text-gray-700'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => handleDeleteDocument(doc.id, doc.name)} 
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Remove Document"
                                >
                                    <i className="ri-delete-bin-line text-lg"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-3">
                             {doc.fileData && (
                                <button onClick={() => handleViewDocument(doc)} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                    <i className="ri-eye-line"></i> View Document
                                </button>
                             )}
                             {doc.status === DocumentStatus.PENDING || doc.status === DocumentStatus.REJECTED ? (
                                 <button onClick={() => triggerFileUpload(doc.id)} className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                                     <i className="ri-upload-2-line"></i> Upload File
                                 </button>
                             ) : (
                                 <button onClick={() => triggerFileUpload(doc.id)} className="text-xs font-medium text-green-600 flex items-center gap-1 hover:text-green-700">
                                     <i className="ri-check-double-line"></i> Change File
                                 </button>
                             )}
                        </div>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50/50">
                        <i className="ri-file-add-line text-4xl mb-2 text-gray-300"></i>
                        <p className="text-sm font-medium">No documents required yet.</p>
                        <p className="text-xs">Add a custom document or select from the quick list.</p>
                    </div>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
    );
};

export default LeadDocuments;

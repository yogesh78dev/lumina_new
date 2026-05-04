
import React from 'react';
import { useCrm } from '../../hooks/useCrm';
import { ImportedFile } from '../../types';
import { useSwal } from '../../hooks/useSwal';

interface ImportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportHistoryModal: React.FC<ImportHistoryModalProps> = ({ isOpen, onClose }) => {
  const { importedLeadFiles, deleteImportedLeadFile } = useCrm();
  const { confirmDelete, fireToast } = useSwal();

  const handleDelete = async (file: ImportedFile) => {
    const result = await confirmDelete({
      title: 'Delete Import Record?',
      html: `Are you sure you want to delete the history for "<strong>${file.fileName}</strong>"? This does not delete the leads themselves.`
    });
    if (result) {
      // FIX: Cast file.id to string to match expected parameter type
      deleteImportedLeadFile(String(file.id));
      fireToast('success', 'Import record deleted.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Import History</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <i className="ri-close-line text-2xl transition-transform duration-300 hover:rotate-90"></i>
          </button>
        </div>
        <div className="flex-grow p-6 overflow-y-auto">
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-600">File Name</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Total Leads</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Added By</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Date</th>
                  <th className="p-3 text-left font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {importedLeadFiles.length > 0 ? (
                  importedLeadFiles.map(file => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{file.fileName}</td>
                      <td className="p-3">{file.totalLeads}</td>
                      <td className="p-3">{file.addedBy}</td>
                      <td className="p-3">{file.createdAt}</td>
                      <td className="p-3">
                         <div className="relative group w-fit">
                            <button onClick={() => handleDelete(file)} className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-500 transition-colors">
                                <i className="ri-delete-bin-5-fill text-base"></i>
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10 pointer-events-none">
                                Delete Record
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">No import history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg">
          <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportHistoryModal;

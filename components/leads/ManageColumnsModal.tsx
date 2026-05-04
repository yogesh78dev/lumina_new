import React, { useState, useEffect } from 'react';
import { LeadTableColumn } from '../../types';

interface ManageColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allColumns: LeadTableColumn[];
  visibleColumns: LeadTableColumn[];
  onSave: (newVisibleColumns: LeadTableColumn[]) => void;
}

const ManageColumnsModal: React.FC<ManageColumnsModalProps> = ({ isOpen, onClose, allColumns, visibleColumns, onSave }) => {
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedColumnKeys(new Set(visibleColumns.map(c => c.key)));
    }
  }, [isOpen, visibleColumns]);

  if (!isOpen) return null;

  const handleCheckboxChange = (columnKey: string) => {
    const newSelection = new Set(selectedColumnKeys);
    if (newSelection.has(columnKey)) {
      newSelection.delete(columnKey);
    } else {
      newSelection.add(columnKey);
    }
    setSelectedColumnKeys(newSelection);
  };

  const handleSave = () => {
    const newVisibleColumns = allColumns.filter(col => selectedColumnKeys.has(col.key));
    onSave(newVisibleColumns);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Manage Columns</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <i className="ri-close-line text-xl transition-transform duration-300 hover:rotate-90"></i>
          </button>
        </div>
        <div className="p-6 max-h-80 overflow-y-auto">
          <div className="space-y-3">
            {allColumns.map(column => (
              <label key={column.key} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={selectedColumnKeys.has(column.key)}
                  onChange={() => handleCheckboxChange(column.key)}
                />
                <span className="text-gray-700">{column.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-3 bg-gray-50 p-4 rounded-b-lg">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium">
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageColumnsModal;
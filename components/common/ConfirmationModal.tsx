import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative" onClick={e => e.stopPropagation()}>
        <div className="p-6 flex items-start">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <i className="ri-error-warning-line text-2xl text-red-600"></i>
            </div>
            <div className="ml-4 text-left">
                 <h3 className="text-lg font-semibold text-gray-900" id="modal-title">{title}</h3>
                <div className="mt-2">
                    <p className="text-sm text-gray-600">{message}</p>
                </div>
            </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string; // For flags
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  buttonClassName?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ options, value, onChange, placeholder = 'Select...', buttonClassName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => options.find(opt => opt.value === value), [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelect = (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
  };

  return (
    <div className="relative w-full h-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`input-field flex items-center justify-between text-left h-full ${buttonClassName}`}
      >
        <span className="flex items-center truncate">
            {selectedOption?.icon && <span className="mr-2 text-base">{selectedOption.icon}</span>}
            <span className="truncate">{selectedOption?.label || <span className="text-gray-500">{placeholder}</span>}</span>
        </span>
        <i className={`ri-arrow-down-s-line text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-w-xs sm:max-w-sm">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto thin-scrollbar p-1">
            {filteredOptions.length > 0 ? filteredOptions.map(option => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="px-3 py-2 text-sm text-gray-800 rounded-md cursor-pointer hover:bg-primary/10 flex items-center"
              >
                {option.icon && <span className="mr-2 text-base">{option.icon}</span>}
                {option.label}
              </li>
            )) : (
                <li className="px-3 py-2 text-sm text-gray-500 text-center">No results found</li>
            )}
          </ul>
        </div>
      )}
      <style>{`
        .thin-scrollbar::-webkit-scrollbar { width: 6px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        .thin-scrollbar { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
      `}</style>
    </div>
  );
};

export default SearchableDropdown;

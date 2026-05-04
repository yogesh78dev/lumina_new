import React from 'react';

interface SettingsListProps {
  sections: { key: string; name: string; icon: string }[];
  activeSection: string;
  onSelectSection: (section: any) => void;
}

const SettingsList: React.FC<SettingsListProps> = ({ sections, activeSection, onSelectSection }) => {
  return (
    <div className="w-full md:w-1/4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <ul>
          {sections.map(section => (
            <li key={section.key}>
              <button
                onClick={() => onSelectSection(section.key)}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center transition-colors duration-200 ${
                  activeSection === section.key
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <i className={`${section.icon} mr-3 w-5 text-center`}></i>
                {section.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SettingsList;
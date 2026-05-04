
import { useContext } from 'react';
import { CrmContext } from '../context/CrmContextCore';

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (context === undefined) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};

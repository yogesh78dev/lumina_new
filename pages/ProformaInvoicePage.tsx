import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCrm } from '../hooks/useCrm';
import PageContainer from '../components/layout/PageContainer';
import ProformaInvoiceModal from '../components/leads/ProformaInvoiceModal';

const ProformaInvoicePage: React.FC = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { leads } = useCrm();

  const lead = useMemo(() => leads.find(l => String(l.id) === String(leadId)), [leads, leadId]);

  if (!lead) {
    return (
      <PageContainer>
        <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-gray-800">Lead not found</h2>
          <p className="text-sm text-gray-500 mt-2">The selected lead could not be loaded.</p>
          <button
            onClick={() => navigate('/leads')}
            className="mt-5 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90"
          >
            Back to Leads
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ProformaInvoiceModal lead={lead} onBack={() => navigate(`/leads/${lead.id}`)} />
    </PageContainer>
  );
};

export default ProformaInvoicePage;

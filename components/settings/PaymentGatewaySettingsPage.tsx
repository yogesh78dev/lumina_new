
import React, { useState, useEffect } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { useSwal } from '../../hooks/useSwal';
import { PaymentGatewaySettings } from '../../types';
import PageContainer from '../layout/PageContainer';

const PaymentGatewaySettingsPage: React.FC = () => {
    const { paymentGatewaySettings, updatePaymentGatewaySettings } = useCrm();
    const { fireToast } = useSwal();
    
    const [formData, setFormData] = useState<PaymentGatewaySettings>({
        gatewayName: 'Razorpay',
        apiKey: '',
        apiSecret: ''
    });

    useEffect(() => {
        if (paymentGatewaySettings) {
            setFormData(paymentGatewaySettings);
        }
    }, [paymentGatewaySettings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updatePaymentGatewaySettings(formData);
            fireToast('success', 'Payment Gateway settings updated!');
        } catch (error) {
            fireToast('error', 'Failed to update settings.');
        }
    };

    return (
        <PageContainer>
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <i className="ri-bank-card-line mr-2 text-primary"></i>
                    Payment Gateway Settings
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Gateway Name <span className="text-primary">*</span></label>
                        <select 
                            value={formData.gatewayName} 
                            onChange={e => setFormData({...formData, gatewayName: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                        >
                            <option value="Razorpay">Razorpay</option>
                            <option value="Stripe">Stripe</option>
                            <option value="PayPal">PayPal</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">API Key <span className="text-primary">*</span></label>
                        <input 
                            type="text" 
                            value={formData.apiKey} 
                            onChange={e => setFormData({...formData, apiKey: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">API Secret <span className="text-primary">*</span></label>
                        <input 
                            type="password" 
                            value={formData.apiSecret} 
                            onChange={e => setFormData({...formData, apiSecret: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                            required
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            Save Settings
                        </button>
                    </div>
                </form>
                <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-md border border-blue-100 flex items-start">
                    <i className="ri-information-line text-xl mr-3 mt-0.5"></i>
                    <div className="text-sm">
                        <p className="font-semibold mb-1">Important Note:</p>
                        <p>These credentials are used to process payments through the CRM. Ensure they are correct and kept confidential. You can find your API keys in your payment gateway's dashboard.</p>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
};

export default PaymentGatewaySettingsPage;

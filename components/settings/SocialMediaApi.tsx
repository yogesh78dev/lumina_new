import React, { useState, useEffect } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { useSwal } from '../../hooks/useSwal';
import { SocialMediaCredentials } from '../../types';

const SocialMediaApi: React.FC = () => {
    const { companyDetails, updateCompanyDetails } = useCrm();
    const { fireToast } = useSwal();
    const [formData, setFormData] = useState<SocialMediaCredentials>({
        facebookAppId: '',
        facebookAppSecret: '',
        facebookAccessToken: '',
    });

    useEffect(() => {
        if (companyDetails?.socialMedia) {
            setFormData(companyDetails.socialMedia);
        }
    }, [companyDetails]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (companyDetails) {
            updateCompanyDetails({ ...companyDetails, socialMedia: formData });
            fireToast('success', 'Facebook API credentials updated!');
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Facebook API Credential</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">App Id <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="facebookAppId"
                        value={formData.facebookAppId}
                        onChange={handleChange}
                        placeholder="Facebook Meta App Id"
                        className="mt-1 input-field"
                        required
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">App Secret Key <span className="text-red-500">*</span></label>
                    <input
                        type="password"
                        name="facebookAppSecret"
                        value={formData.facebookAppSecret}
                        onChange={handleChange}
                        placeholder="Facebook App Secret Key"
                        className="mt-1 input-field"
                        required
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Access Token <span className="text-red-500">*</span></label>
                    <input
                        type="password"
                        name="facebookAccessToken"
                        value={formData.facebookAccessToken}
                        onChange={handleChange}
                        placeholder="Access Token"
                        className="mt-1 input-field"
                        required
                    />
                </div>
                <div className="pt-4">
                    <button type="submit" className="px-5 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90">
                        Submit Details
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SocialMediaApi;
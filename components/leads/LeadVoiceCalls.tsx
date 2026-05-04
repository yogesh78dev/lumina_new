
import React from 'react';
import { Lead } from '../../types';
import { useCrm } from '../../hooks/useCrm';
import { format } from 'date-fns';

const LeadVoiceCalls: React.FC<{ lead: Lead }> = ({ lead }) => {
    const { getCallLogsForLead, initiateCall, activeCall } = useCrm();
    const logs = getCallLogsForLead(lead.id);

    const formatDuration = (seconds: number) => {
        if (!seconds) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'failed': return 'bg-red-100 text-red-700 border-red-200';
            case 'no-answer': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'busy': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Call Action Banner */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                        <i className="ri-phone-fill text-2xl"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900">Voice Calling</h4>
                        <p className="text-sm text-blue-700 opacity-80">Initiate a direct call to {lead.name}</p>
                    </div>
                </div>
                <button 
                    onClick={() => initiateCall(lead.id, lead.name, lead.phone)}
                    disabled={!!activeCall}
                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i className="ri-phone-line"></i> Call Now
                </button>
            </div>

            {/* Call History */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h5 className="font-bold text-gray-900 flex items-center gap-2">
                        <i className="ri-history-line text-gray-400"></i>
                        Call History
                    </h5>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {logs.length} Total Calls
                    </span>
                </div>

                {logs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <i className="ri-phone-line text-2xl text-gray-300"></i>
                        </div>
                        <p className="text-gray-500 text-sm">No call history found for this lead.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(log => (
                            <div key={log.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            log.direction === 'outbound' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                        }`}>
                                            <i className={log.direction === 'outbound' ? 'ri-phone-fill' : 'ri-phone-receive-fill'}></i>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900">
                                                    {log.direction === 'outbound' ? 'Outbound Call' : 'Inbound Call'}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(log.status)}`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {format(new Date(log.createdAt), 'MMM dd, yyyy • hh:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                            <i className="ri-time-line text-gray-400"></i>
                                            {formatDuration(log.duration || 0)}
                                        </div>
                                        {log.recordingUrl && (
                                            <a 
                                                href={log.recordingUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-[10px] text-blue-600 hover:underline font-bold flex items-center gap-1 mt-1"
                                            >
                                                <i className="ri-play-circle-line"></i> Listen Recording
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadVoiceCalls;


import React from 'react';
import { useCrm } from '../../hooks/useCrm';
import { motion, AnimatePresence } from 'motion/react';

const CallOverlay: React.FC = () => {
    const { activeCall, endCall } = useCrm();

    if (!activeCall) return null;

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusColor = () => {
        switch (activeCall.status) {
            case 'ringing': return 'text-blue-500';
            case 'connected': return 'text-green-500';
            case 'failed': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 right-6 z-[9999]"
            >
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-80 overflow-hidden relative">
                    {/* Pulsing Background for Active Call */}
                    {activeCall.status === 'connected' && (
                        <div className="absolute inset-0 bg-green-50 opacity-30 animate-pulse pointer-events-none"></div>
                    )}
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 ${activeCall.status === 'connected' ? 'ring-4 ring-green-100' : ''}`}>
                                    <i className={`ri-user-line text-2xl ${getStatusColor()}`}></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 truncate w-40">{activeCall.leadName}</h4>
                                    <p className="text-xs text-gray-500">{activeCall.phoneNumber}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 ${getStatusColor()}`}>
                                    {activeCall.status}
                                </span>
                                {activeCall.status === 'connected' && (
                                    <p className="text-sm font-mono font-bold text-gray-700 mt-1">
                                        {formatDuration(activeCall.duration)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            {/* Mute Button (UI Only) */}
                            <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                                <i className="ri-mic-off-line"></i>
                            </button>
                            
                            {/* End Call Button */}
                            <button 
                                onClick={endCall}
                                className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200 hover:bg-red-600 transition-all transform hover:scale-105 active:scale-95"
                            >
                                <i className="ri-phone-fill text-2xl rotate-[135deg]"></i>
                            </button>

                            {/* Speaker Button (UI Only) */}
                            <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
                                <i className="ri-volume-up-line"></i>
                            </button>
                        </div>

                        {activeCall.isMock && (
                            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                                <span className="text-[10px] text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">
                                    <i className="ri-test-tube-line mr-1"></i> Simulation Mode
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CallOverlay;

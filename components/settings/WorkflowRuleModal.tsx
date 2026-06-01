import React, { useState, useEffect } from 'react';
import { useCrm } from '../../hooks/useCrm';
// FIX: Import TriggerField to correctly type the component's state.
import { WorkflowRule, ActionType, TriggerField } from '../../types';

interface WorkflowRuleModalProps {
    rule: WorkflowRule | null;
}

const WorkflowRuleModal: React.FC<WorkflowRuleModalProps> = ({ rule }) => {
    const { leadStatuses, addWorkflowRule, updateWorkflowRule, closeWorkflowModal } = useCrm();

    const getInitialState = () => ({
        name: '',
        triggerModule: 'Lead' as const,
        triggerEvent: 'updated' as const,
        // FIX: Widen the type of 'field' to TriggerField to match the WorkflowRule type.
        conditions: [{ field: 'leadStatus' as TriggerField, value: leadStatuses[0]?.name || '' }],
        actionType: 'createReminder' as ActionType,
        actionDetails: {
            note: '',
            dueInDays: 3
        }
    });

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (rule) {
            // FIX: Construct a state object from the 'rule' prop that is compatible with the form's state type,
            // providing default values for optional properties.
            setFormData({
                name: rule.name,
                triggerModule: rule.triggerModule,
                triggerEvent: rule.triggerEvent,
                conditions: rule.conditions,
                actionType: rule.actionType,
                actionDetails: {
                    note: rule.actionDetails?.note ?? '',
                    dueInDays: rule.actionDetails?.dueInDays ?? 3,
                },
            });
        } else {
            setFormData(getInitialState());
        }
    }, [rule, leadStatuses]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'note' || name === 'dueInDays') {
            setFormData(prev => ({ ...prev, actionDetails: { ...prev.actionDetails, [name]: name === 'dueInDays' ? Number(value) : value } }));
        } else if (name === 'conditionValue') {
            setFormData(prev => ({...prev, conditions: [{...prev.conditions[0], value: value}]}));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (rule) {
                // FIX: Pass the rule's ID along with form data when updating.
                await updateWorkflowRule({ ...formData, id: rule.id });
            } else {
                await addWorkflowRule(formData);
            }
            closeWorkflowModal();
        } catch (error) {
            console.error('Failed to save workflow rule:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[11000] flex justify-center items-center p-4" onClick={closeWorkflowModal}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-5 border-b">
                        <h3 className="text-xl font-semibold">{rule ? 'Edit Workflow Rule' : 'Create Workflow Rule'}</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Rule Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 input-field" required />
                        </div>

                        {/* Trigger */}
                        <div className="p-4 border rounded-md">
                            <h4 className="font-semibold text-primary mb-2">WHEN...</h4>
                            <p className="text-sm">A <span className="font-bold">{formData.triggerModule}</span> is <span className="font-bold">{formData.triggerEvent}</span></p>
                        </div>
                        
                        {/* Condition */}
                        <div className="p-4 border rounded-md">
                             <h4 className="font-semibold text-primary mb-2">IF...</h4>
                             <div className="flex items-center space-x-2 text-sm">
                                <span>The</span>
                                <input type="text" readOnly value="Status" className="input-field-sm bg-gray-100 w-24" />
                                <span>is</span>
                                <select name="conditionValue" value={formData.conditions[0].value} onChange={handleChange} className="input-field-sm">
                                    {leadStatuses.map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
                                </select>
                             </div>
                        </div>

                        {/* Action */}
                        <div className="p-4 border rounded-md space-y-3">
                             <h4 className="font-semibold text-primary mb-2">THEN...</h4>
                             <div className="flex items-center space-x-2 text-sm">
                                 <select name="actionType" value={formData.actionType} onChange={handleChange} className="input-field-sm">
                                    <option value="createReminder">Create a Reminder</option>
                                    <option value="createNote">Create a Note</option>
                                 </select>
                             </div>
                             {formData.actionType === 'createReminder' && (
                                <div className="flex items-center space-x-2 text-sm pl-4">
                                    <span>with note:</span>
                                    <input type="text" name="note" value={formData.actionDetails.note} onChange={handleChange} className="input-field-sm flex-grow" placeholder="e.g., Follow up for payment" />
                                    <span>due in</span>
                                    <input type="number" name="dueInDays" value={formData.actionDetails.dueInDays} onChange={handleChange} className="input-field-sm w-16" />
                                    <span>days.</span>
                                </div>
                             )}
                             {formData.actionType === 'createNote' && (
                                 <div className="pl-4">
                                     <textarea name="note" value={formData.actionDetails.note} onChange={handleChange} placeholder="Enter note content..." rows={2} className="input-field-sm w-full"></textarea>
                                 </div>
                             )}
                        </div>

                    </div>
                    <div className="flex justify-end p-4 bg-gray-50 border-t space-x-2">
                        <button type="button" onClick={closeWorkflowModal} className="px-4 py-2 bg-gray-200 rounded-md text-sm">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md text-sm">{rule ? 'Update Rule' : 'Create Rule'}</button>
                    </div>
                </form>
                 <style>{`
                    .input-field { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; }
                    .input-field-sm { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.375rem 0.5rem; font-size: 0.875rem; }
                 `}</style>
            </div>
        </div>
    );
};

export default WorkflowRuleModal;

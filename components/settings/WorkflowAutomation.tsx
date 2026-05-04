import React, { useState } from 'react';
import { useCrm } from '../../hooks/useCrm';
import { useSwal } from '../../hooks/useSwal';
import { WorkflowRule } from '../../types';
import WorkflowRuleModal from './WorkflowRuleModal';

const WorkflowAutomation: React.FC = () => {
    const { workflowRules, deleteWorkflowRule, isWorkflowModalOpen, openWorkflowModal, editingWorkflow } = useCrm();
    const { confirmDelete, fireToast } = useSwal();

    const handleDelete = async (rule: WorkflowRule) => {
        const result = await confirmDelete({
            title: 'Delete Workflow Rule?',
            html: `Are you sure you want to delete the rule "<strong>${rule.name}</strong>"?`,
        });

        if (result) {
            deleteWorkflowRule(rule.id);
            fireToast('success', 'Workflow rule deleted.');
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Workflow Automation</h2>
                <button onClick={() => openWorkflowModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 flex items-center">
                    <i className="ri-add-line mr-2"></i>New Rule
                </button>
            </div>

            <div className="space-y-4">
                {workflowRules.length > 0 ? (
                    workflowRules.map(rule => (
                        <div key={rule.id} className="bg-gray-50 border rounded-lg p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-800">{rule.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">When</span> a lead is {rule.triggerEvent} and status changes to "{rule.conditions[0].value}", 
                                    <span className="font-medium"> then</span> create a reminder.
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => openWorkflowModal(rule)} className="p-2 text-gray-500 hover:text-primary"><i className="ri-pencil-line"></i></button>
                                <button onClick={() => handleDelete(rule)} className="p-2 text-gray-500 hover:text-red-500"><i className="ri-delete-bin-line"></i></button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <i className="ri-robot-2-line text-5xl text-gray-300"></i>
                        <h3 className="mt-4 text-lg font-semibold text-gray-700">No workflow rules yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Create a rule to automate your repetitive tasks.</p>
                    </div>
                )}
            </div>
            {isWorkflowModalOpen && <WorkflowRuleModal rule={editingWorkflow} />}
        </div>
    );
};

export default WorkflowAutomation;

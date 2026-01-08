
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { IndividualLndPlanRecord } from '../types';
import { XIcon, PaperAirplaneIcon, SparklesIcon } from './icons';

interface ModalProps {
    onClose: () => void;
}

type Message = {
    sender: 'user' | 'ai';
    content: string | React.ReactNode;
};

const LND_PLANS_KEY = 'cna_individualLndPlansDraft';

// --- Local "Tools" the AI can call ---

const getPlanSummary = (data: IndividualLndPlanRecord[]): string => {
    if (data.length === 0) {
        return "The L&D plan is currently empty. No summary can be generated.";
    }
    const totalOfficers = data.length;
    const byDivision = data.reduce((acc, p) => {
        if(p.division) acc[p.division] = (acc[p.division] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const sentForStudiesCount = data.filter(plan => 
        Object.values(plan.trainingNeeds || {}).flat().some(need => (need as any).status === 'Completed')
    ).length;
    
    const plannedTrainingsPerYear = data.flatMap(p => Object.values(p.trainingNeeds || {}).flat())
        .reduce((acc, need) => {
            const n = need as any;
            if (n.yearOfCommencement) {
                acc[n.yearOfCommencement] = (acc[n.yearOfCommencement] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

    let summary = `Here is a summary of the current L&D Plan:\n`;
    summary += `• Total Officers in Plan: ${totalOfficers}\n`;
    summary += `• Officers Sent for Studies: ${sentForStudiesCount}\n`;
    summary += `• Officers per Division:\n`;
    summary += Object.entries(byDivision).map(([div, count]) => `  - ${div}: ${count}`).join('\n');
    summary += `\n• Planned Trainings per Year:\n`;
    summary += Object.entries(plannedTrainingsPerYear).sort(([a],[b])=> a.localeCompare(b)).map(([year, count]) => `  - ${year}: ${count} trainings`).join('\n');
    return summary;
};

const findOfficers = (criteria: any, data: IndividualLndPlanRecord[]): string => {
    let results = [...data];
    const filtersApplied: string[] = [];

    if (criteria.officerStatus) {
        results = results.filter(p => p.officerStatus?.toLowerCase() === criteria.officerStatus.toLowerCase());
        filtersApplied.push(`Status: ${criteria.officerStatus}`);
    }
    
    if (criteria.hasBeenSentForStudies === true) {
        const officersWithCompletedStudies = new Set<string>();
        data.forEach(plan => {
            const hasCompleted = Object.values(plan.trainingNeeds || {}).flat().some(need => (need as any).status === 'Completed');
            if (hasCompleted) {
                officersWithCompletedStudies.add(plan.id);
            }
        });
        results = results.filter(p => officersWithCompletedStudies.has(p.id));
        filtersApplied.push('Has been sent for studies');
    }
    
    if (criteria.hasBeenSentForStudies === false) {
        const officersWithCompletedStudies = new Set<string>();
        data.forEach(plan => {
            const hasCompleted = Object.values(plan.trainingNeeds || {}).flat().some(need => (need as any).status === 'Completed');
            if (hasCompleted) {
                officersWithCompletedStudies.add(plan.id);
            }
        });
        results = results.filter(p => !officersWithCompletedStudies.has(p.id));
        filtersApplied.push('Has NOT been sent for studies');
    }

    if (filtersApplied.length === 0) {
        return "I can help you find officers in the L&D plan. Please provide a specific criteria, for example: 'Show me all confirmed officers'.";
    }
    
    if (results.length === 0) {
        return `I found no officers matching the criteria: ${filtersApplied.join(', ')}.`;
    }
    
    const officerList = results.map(p => `• ${p.officerName} (${p.designation})`).join('\n');
    return `Found ${results.length} officer(s) matching: ${filtersApplied.join(', ')}\n\n${officerList}`;
};

const getGuidance = (topic: string): string => {
    switch((topic || '').toLowerCase()) {
        case 'add':
        case 'new officer':
            return "To add a new officer's L&D plan, please use the 'Individual L&D Plan (Manual Form)' which you can find in the 'Planning & Forms' menu on the main dashboard.";
        case 'update':
        case 'edit':
             return "You can update an officer's plan from the 'Individual L&D Plan (Manual Form)'. Find the officer in the 'Saved Plans' list and click the edit (pencil) icon.";
        case 'export':
        case 'share':
             return "Exporting and sharing plans can be done from the 'Individual L&D Plan (Manual Form)'. You can export a single officer's plan or a bulk export of all plans.";
        default:
             return "You can ask me to:\n• 'add a new officer'\n• 'update an officer'\n• 'list confirmed officers'\n• 'show a summary of the plan'";
    }
};

// --- AI Tool Definitions ---
const getPlanSummaryTool: FunctionDeclaration = {
  name: 'getPlanSummary',
  description: 'Gets a summary of the current L&D plan, including total officers, breakdown by division, and number of planned trainings.',
  parameters: { type: Type.OBJECT, properties: {} }
};

const findOfficersTool: FunctionDeclaration = {
  name: 'findOfficers',
  description: 'Finds and lists officers in the L&D plan based on specific criteria.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      officerStatus: {
        type: Type.STRING,
        description: "The employment status of the officers to find (e.g., 'Confirmed', 'Probation')."
      },
      hasBeenSentForStudies: {
        type: Type.BOOLEAN,
        description: 'Whether to find officers who have (true) or have not (false) completed any training.'
      }
    }
  }
};

const getGuidanceTool: FunctionDeclaration = {
  name: 'getGuidance',
  description: 'Provides guidance on how to use the application for tasks like adding, editing, or exporting data.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: {
        type: Type.STRING,
        description: "The topic the user needs help with (e.g., 'add', 'update', 'export', 'help')."
      }
    },
    required: ['topic']
  }
};

const tools = [{ functionDeclarations: [getPlanSummaryTool, findOfficersTool, getGuidanceTool] }];


export const LndAiAssistantModal: React.FC<ModalProps> = ({ onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [planData, setPlanData] = useState<IndividualLndPlanRecord[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem(LND_PLANS_KEY);
            if (savedData) {
                setPlanData(JSON.parse(savedData));
            }
        } catch (e) {
            console.error("Failed to load L&D plan data for AI Assistant:", e);
        }
        setMessages([{
            sender: 'ai',
            content: "Hello! I'm your AI assistant for managing the L&D Plan. How can I help you today? You can ask me to summarize the plan, find officers, or ask for 'help'."
        }]);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', content: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            if (!process.env.API_KEY) {
                throw new Error("API key is not configured.");
            }

            /* Correct initialization as per guidelines */
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const systemInstruction = `You are the "L&D AI Assistant," an expert on the Capability Needs Analysis System (CNAS) and Learning & Development within the Papua New Guinea (PNG) public service. Your purpose is to help users understand and manage their L&D data.

            **Your Capabilities:**
            1.  **Answer General Questions:** You can answer questions about the CNAS application, L&D principles (like the 70:20:10 model), strategic alignment (with UN SDGs and PNG's MTDP IV), and general HR topics in the PNG context.
            2.  **Use Tools for Specific Tasks:** You have access to tools to query the user's current L&D plan data. When a user asks you to perform a specific action like summarizing the plan or finding officers, you should use the appropriate tool.

            **Current Context:**
            - The user is currently interacting with a dataset containing L&D plans for ${planData.length} officers.
            - The CNAS application can generate various reports, including 5-Year Plans, Competency Reports, and Talent Segmentation analyses.

            Always provide helpful, concise, and accurate responses. If you use a tool, provide the tool's output directly to the user in a readable format.`;
            
            const prompt = `The user's request is: "${inputValue}"`;

            /* Updated model to gemini-3-flash-preview as per guidelines */
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    systemInstruction,
                    tools,
                },
            });
            
            let aiResponseContent: string | React.ReactNode;

            if (response.functionCalls && response.functionCalls.length > 0) {
                const fc = response.functionCalls[0]; // Process the first function call
                switch (fc.name) {
                    case 'getPlanSummary':
                        aiResponseContent = getPlanSummary(planData);
                        break;
                    case 'findOfficers':
                        aiResponseContent = findOfficers(fc.args, planData);
                        break;
                    case 'getGuidance':
                        aiResponseContent = getGuidance(fc.args.topic as string);
                        break;
                    default:
                        aiResponseContent = "I tried to use a tool I don't recognize. Could you rephrase your request?";
                }
            } else {
                /* Accessing .text property directly as per guidelines */
                aiResponseContent = response.text || '';
            }

            const aiMessage: Message = { sender: 'ai', content: aiResponseContent };
            setMessages(prev => [...prev, aiMessage]);

        } catch (e) {
            console.error("AI Assistant Error:", e);
            const errorContent = e instanceof Error ? e.message : "An unknown error occurred.";
            const errorMessage: Message = { sender: 'ai', content: `Sorry, I encountered an error: ${errorContent}. Please try again.` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col h-[70vh]">
                <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-amber-500" />
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">L&D AI Assistant</h1>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close AI Assistant">
                        <XIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>}
                            <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'ai' ? 'bg-white dark:bg-slate-800' : 'bg-amber-600 text-white'}`}>
                                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" /></div>
                            <div className="max-w-md p-3 rounded-lg bg-white dark:bg-slate-800">
                               <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                               </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </main>

                <footer className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask me to find officers or show a summary..."
                            className="w-full p-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md shadow-sm"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading}
                            className="p-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-slate-400"
                            aria-label="Send message"
                        >
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

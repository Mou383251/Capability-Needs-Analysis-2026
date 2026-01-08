import React, { useState, useRef, useEffect } from 'react';
import { ArrowDownTrayIcon, DocumentIcon, TableCellsIcon, ClipboardIcon, PrinterIcon, ChevronDownIcon } from './icons';

interface ExportMenuProps {
    onExport: (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets' | 'json' | 'print') => void;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ onExport }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleExport = (format: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'sheets' | 'json' | 'print') => {
        onExport(format);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left no-print" ref={menuRef}>
            <div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                >
                    Export
                    <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" />
                </button>
            </div>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleExport('pdf'); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                            <DocumentIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" /> PDF
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleExport('docx'); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                            <DocumentIcon className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" /> DOCX
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleExport('xlsx'); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                            <TableCellsIcon className="mr-3 h-5 w-5 text-green-500" aria-hidden="true" /> XLSX
                        </a>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleExport('print'); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                            <PrinterIcon className="mr-3 h-5 w-5 text-gray-500" aria-hidden="true" /> Print
                        </a>
                         <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleExport('csv'); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                           <DocumentIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" /> CSV
                        </a>
                         <a href="#" onClick={(e) => { e.preventDefault(); handleExport('sheets'); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                           <ClipboardIcon className="mr-3 h-5 w-5 text-green-400" aria-hidden="true" /> Copy for Sheets
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleExport('json'); }} className="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                           <DocumentIcon className="mr-3 h-5 w-5 text-yellow-500" aria-hidden="true" /> JSON
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

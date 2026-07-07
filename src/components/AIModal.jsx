import { useState, useRef } from 'react';
import { parseFile } from '../utils/fileParser';

const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt'];

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AIModal({ isOpen, onClose, onGenerate }) {
    const [inputMethod, setInputMethod] = useState('file'); // 'file' or 'text'
    const [textInput, setTextInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const acceptFile = (file) => {
        if (!file) return;
        const extension = file.name.split('.').pop().toLowerCase();
        if (!ACCEPTED_EXTENSIONS.includes(extension)) {
            setError('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
            return;
        }
        setSelectedFile(file);
        setError('');
    };

    const handleFileSelect = (e) => {
        acceptFile(e.target.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        acceptFile(e.dataTransfer.files?.[0]);
    };

    const handleGenerate = async () => {
        setError('');
        setIsProcessing(true);

        try {
            let businessText = '';

            if (inputMethod === 'file') {
                if (!selectedFile) {
                    throw new Error('Please select a file');
                }
                businessText = await parseFile(selectedFile);
            } else {
                if (!textInput.trim()) {
                    throw new Error('Please enter your business description');
                }
                businessText = textInput;
            }

            await onGenerate(businessText);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Generate with AI
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Input Method Toggle */}
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                        <button
                            onClick={() => setInputMethod('file')}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${inputMethod === 'file'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Upload File
                        </button>
                        <button
                            onClick={() => setInputMethod('text')}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${inputMethod === 'text'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Paste Text
                        </button>
                    </div>

                    {/* File Upload */}
                    {inputMethod === 'file' && (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700">
                                Upload your business document (.pdf, .txt, .docx)
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.txt,.docx"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging
                                        ? 'border-slate-900 bg-slate-100'
                                        : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                {selectedFile ? (
                                    <>
                                        <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <div className="text-center">
                                            <p className="font-medium text-slate-900">{selectedFile.name}</p>
                                            <p className="text-sm text-slate-500">{formatFileSize(selectedFile.size)}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="text-sm text-slate-500 underline hover:text-slate-700"
                                        >
                                            Remove file
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <div className="text-center">
                                            <p className="font-medium text-slate-700">
                                                Drag &amp; drop your document here
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                or click to browse — PDF, DOCX or TXT
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Text Input */}
                    {inputMethod === 'text' && (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700">
                                Describe your business idea
                            </label>
                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Enter a detailed description of your business idea, target market, value proposition, revenue model, etc."
                                rows={8}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none resize-none"
                            />
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 space-y-4">
                    <p className="text-xs text-slate-400">
                        Your description is processed by Google Gemini to generate the canvas —
                        avoid uploading confidential documents.
                    </p>
                    <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="px-6 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isProcessing}
                        className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                            'Generate Canvas'
                        )}
                    </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useRef } from 'react';
import { parseFile } from '../utils/fileParser';

export default function AIModal({ isOpen, onClose, onGenerate }) {
    const [inputMethod, setInputMethod] = useState('file'); // 'file' or 'text'
    const [textInput, setTextInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setError('');
        }
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
                            <div className="flex items-center gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.txt,.docx"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                                >
                                    Choose File
                                </button>
                                {selectedFile && (
                                    <span className="text-sm text-slate-600">
                                        {selectedFile.name}
                                    </span>
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
                <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
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
                        className="px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Generating...' : 'Generate Canvas'}
                    </button>
                </div>
            </div>
        </div>
    );
}

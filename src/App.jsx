import { useState, useEffect } from 'react';
import Landing from './components/Landing';
import BMCCanvas from './components/BMCCanvas';
import AIModal from './components/AIModal';
import { generateBMCFromText } from './api/gemini';
import { saveToLocalStorage, loadFromLocalStorage } from './utils/storage';
import './index.css';

const EXPORT_FORMATS = {
  pdf: { label: 'PDF', description: 'Document (A4 landscape)' },
  png: { label: 'PNG', description: 'High-resolution image' },
  pptx: { label: 'PowerPoint', description: 'Ready-to-use 16:9 slide' },
};

const initialData = {
  key_partners: '',
  key_activities: '',
  key_resources: '',
  value_propositions: '',
  customer_relationships: '',
  channels: '',
  customer_segments: '',
  cost_structure: '',
  revenue_streams: '',
};

function App() {
  const [view, setView] = useState('landing'); // 'landing' or 'canvas'
  const [canvasData, setCanvasData] = useState(() => loadFromLocalStorage() || initialData);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Auto-save on data change
  useEffect(() => {
    if (view === 'canvas') {
      saveToLocalStorage(canvasData);
    }
  }, [canvasData, view]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateManually = () => {
    setView('canvas');
  };

  const handleGenerateWithAI = () => {
    setIsAIModalOpen(true);
  };

  const handleAIGenerate = async (businessText) => {
    try {
      const generatedData = await generateBMCFromText(businessText);
      setCanvasData(generatedData);
      setView('canvas');
      showNotification('Business Model Canvas generated successfully!');
    } catch (error) {
      showNotification(error.message, 'error');
      throw error; // Re-throw to let modal handle it
    }
  };

  // Direct download in the chosen format. Every renderer draws the same
  // shared A4 layout programmatically and is loaded on demand to keep the
  // initial bundle small.
  const handleExport = async (format = exportFormat) => {
    setExportFormat(format);
    setIsExportMenuOpen(false);
    try {
      if (format === 'png') {
        const { exportToPNG } = await import('./utils/imageExport');
        exportToPNG(canvasData);
      } else if (format === 'pptx') {
        const { exportToPPTX } = await import('./utils/pptxExport');
        await exportToPPTX(canvasData);
      } else {
        const { exportToPDF } = await import('./utils/pdfExport');
        exportToPDF(canvasData);
      }
    } catch (error) {
      showNotification(`Failed to export ${EXPORT_FORMATS[format].label}: ` + error.message, 'error');
    }
  };

  const handleBackToLanding = () => {
    setView('landing');
  };

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
      setCanvasData(initialData);
      showNotification('Canvas cleared');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${notification.type === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-green-500 text-white'
          }`}>
          {notification.message}
        </div>
      )}

      {/* Landing View */}
      {view === 'landing' && (
        <Landing
          onCreateManually={handleCreateManually}
          onGenerateWithAI={handleGenerateWithAI}
        />
      )}

      {/* Canvas View */}
      {view === 'canvas' && (
        <div className="min-h-screen py-8">
          {/* Toolbar */}
          <div className="max-w-[1400px] mx-auto px-8 mb-6 flex justify-between items-center no-print">
            <button
              onClick={handleBackToLanding}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleClearCanvas}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Clear Canvas
              </button>
              <button
                onClick={handleGenerateWithAI}
                className="px-4 py-2 bg-white border-2 border-slate-900 text-slate-900 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Generate with AI
              </button>
              {/* Split button: main part exports the current format, the
                  arrow opens the format menu */}
              <div className="relative">
                <div className="flex">
                  <button
                    onClick={() => handleExport()}
                    className="px-6 py-2 bg-slate-900 text-white rounded-l-lg hover:bg-slate-800 transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export {EXPORT_FORMATS[exportFormat].label}
                  </button>
                  <button
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    aria-label="Choose export format"
                    className="px-2 py-2 bg-slate-900 text-white rounded-r-lg hover:bg-slate-800 transition-colors border-l border-slate-700 flex items-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {isExportMenuOpen && (
                  <>
                    {/* click-outside catcher */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsExportMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20 overflow-hidden">
                      {Object.entries(EXPORT_FORMATS).map(([format, { label, description }]) => (
                        <button
                          key={format}
                          onClick={() => handleExport(format)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                        >
                          <span>
                            <span className="block font-medium text-slate-900">{label}</span>
                            <span className="block text-sm text-slate-500">{description}</span>
                          </span>
                          {exportFormat === format && (
                            <svg className="w-5 h-5 text-slate-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <BMCCanvas data={canvasData} onDataChange={setCanvasData} />
        </div>
      )}

      {/* AI Modal */}
      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onGenerate={handleAIGenerate}
      />
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import Landing from './components/Landing';
import BMCCanvas from './components/BMCCanvas';
import AIModal from './components/AIModal';
import { generateBMCFromText } from './api/gemini';
import { saveToLocalStorage, loadFromLocalStorage } from './utils/storage';
import './index.css';

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

  // Native print-to-PDF: the print stylesheet lays the canvas out on an
  // A4 landscape page, so the browser's "Save as PDF" gives a vector-sharp
  // export with no rasterization quirks.
  const handleExportPDF = () => {
    window.print();
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
              <button
                onClick={handleExportPDF}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
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

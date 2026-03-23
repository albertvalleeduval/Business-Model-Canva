export default function Landing({ onCreateManually, onGenerateWithAI }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full text-center">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-5xl font-bold text-slate-900 mb-4">
                        Business Model Canvas Creator
                    </h1>
                    <p className="text-lg text-slate-600">
                        Professional tool for students and entrepreneurs
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={onCreateManually}
                        className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                        Create Manually
                    </button>

                    <button
                        onClick={onGenerateWithAI}
                        className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-semibold rounded-lg border-2 border-slate-900 hover:bg-slate-50 transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                        Generate with AI
                    </button>
                </div>

                {/* Info Section */}
                <div className="mt-16 p-6 bg-white rounded-lg shadow-sm border border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800 mb-3">
                        What is a Business Model Canvas?
                    </h2>
                    <p className="text-slate-600 leading-relaxed">
                        A strategic management tool that helps you describe, design, and pivot your business model.
                        It provides a visual chart with 9 key building blocks covering customers, infrastructure,
                        finances, and value proposition.
                    </p>
                </div>
            </div>
        </div>
    );
}

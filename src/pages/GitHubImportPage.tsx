import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, GithubIcon } from '../Svg/Icons';

interface ImportStep {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed';
}

export function GitHubImportPage() {
  const navigate = useNavigate();
  const [selectedRepo, setSelectedRepo] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const [steps, setSteps] = useState<ImportStep[]>([
    { id: '1', title: 'Cloning project...', status: 'pending' },
    { id: '2', title: 'Adding nodes...', status: 'pending' },
    { id: '3', title: 'Creating canvas...', status: 'pending' },
    { id: '4', title: 'Making things tidy...', status: 'pending' },
  ]);

  const mockRepos = [
    'user/ecommerce-api',
    'user/payment-service',
    'user/user-management',
    'user/notification-service',
    'user/analytics-dashboard'
  ];

  useEffect(() => {
    if (!isImporting) return;

    const interval = setInterval(() => {
      setSteps(prevSteps => {
        const newSteps = [...prevSteps];
        
        // Mark current step as completed
        if (currentStepIndex > 0) {
          newSteps[currentStepIndex - 1].status = 'completed';
        }
        
        // Mark current step as active
        if (currentStepIndex < newSteps.length) {
          newSteps[currentStepIndex].status = 'active';
        }

        return newSteps;
      });

      if (currentStepIndex < steps.length) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        // All steps completed
        clearInterval(interval);
        setTimeout(() => {
          navigate('/canvas/imported-project');
        }, 1000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isImporting, currentStepIndex, navigate, steps.length]);

  const handleImport = () => {
    if (!selectedRepo) return;
    setIsImporting(true);
    setCurrentStepIndex(0);
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (isImporting) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-[#1e1e1e] rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Importing Repository</h2>
              <p className="text-gray-300">Setting up your project...</p>
            </div>

            <div className="space-y-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center p-4 rounded-lg transition-all duration-500 ${
                    step.status === 'completed'
                      ? 'bg-green-900/20 border border-green-500'
                      : step.status === 'active'
                      ? 'bg-yellow-900/20 border border-yellow-400 scale-105'
                      : 'bg-gray-800 border border-gray-600'
                  }`}
                >
                  <div className="flex-shrink-0 mr-4">
                    {step.status === 'completed' ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckIcon className="w-4 h-4 text-white" />
                      </div>
                    ) : step.status === 'active' ? (
                      <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full" />
                    )}
                  </div>
                  <span
                    className={`font-medium transition-colors ${
                      step.status === 'completed'
                        ? 'text-green-400'
                        : step.status === 'active'
                        ? 'text-yellow-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStepIndex / steps.length) * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {currentStepIndex} of {steps.length} steps completed
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Import from GitHub</h1>
          <p className="text-gray-300">Select a repository to import and analyze</p>
        </div>

        <div className="bg-[#1e1e1e] rounded-lg shadow-sm border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Select Repository</h2>
          
          <div className="space-y-3">
            {mockRepos.map((repo) => (
              <label
                key={repo}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#2a2a2a] ${
                  selectedRepo === repo
                    ? 'border-yellow-400 bg-yellow-900/20'
                    : 'border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="repository"
                  value={repo}
                  checked={selectedRepo === repo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                  selectedRepo === repo
                    ? 'border-yellow-400 bg-yellow-400'
                    : 'border-gray-500'
                }`}>
                  {selectedRepo === repo && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex items-center">
                  <GithubIcon className="w-5 h-5 text-gray-300 mr-3" />
                  <span className="font-medium text-white">{repo}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-600 text-gray-200 font-medium rounded-lg hover:bg-[#1e1e1e] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedRepo}
              className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              Import Repository
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
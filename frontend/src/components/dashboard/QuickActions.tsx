import { PlusIcon, GithubIcon, BrainIcon } from "../../Svg/Icons";

interface QuickActionsProps {
  onNewProject: () => void;
  onGitHubImport: () => void;
  onConnectGitHub: () => void;
  isGitHubConnected: boolean;
}

// New Project Button Component
function NewProjectButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-6 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group bg-yellow-400 border-yellow-500 text-gray-900 hover:bg-yellow-500 btn-hover"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-gray-900 text-yellow-400">
          <PlusIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-rb mb-1 text-gray-900">New Project</h3>
          <p className="text-sm font-rr text-gray-700">Start from scratch</p>
        </div>
      </div>
    </button>
  );
}

// GitHub Button Component
function GitHubButton({
  isConnected,
  onConnect,
  onImport,
}: {
  isConnected: boolean;
  onConnect: () => void;
  onImport: () => void;
}) {
  const handleClick = isConnected ? onImport : onConnect;
  const title = isConnected ? "Import from GitHub" : "Connect GitHub";
  const description = isConnected
    ? "Import existing repository"
    : "Connect your GitHub account";

  if (isConnected) {
    return (
      <button
        onClick={handleClick}
        className="p-6 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group bg-[#1a1a1a] border-gray-800 text-white hover:border-gray-700 card-hover"
      >
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-[#2a2a2a] text-gray-400 group-hover:text-gray-200 transition-colors">
            <GithubIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-rb mb-1 text-white">{title}</h3>
            <p className="text-sm font-rr text-gray-400">{description}</p>
          </div>
        </div>
      </button>
    );
  }

  // Disconnected state with subtle red styling
  return (
    <button
      onClick={handleClick}
      className="p-6 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group bg-gradient-to-br from-red-950/30 to-orange-950/30 border-red-800/40 text-white hover:border-red-700/60 card-hover"
    >
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-red-900/30 text-red-400 group-hover:text-red-300 transition-colors">
          <GithubIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-rb text-white">{title}</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              <span className="text-xs text-red-400 font-rm">Required</span>
            </div>
          </div>
          <p className="text-sm font-rr text-red-300/80">{description}</p>
        </div>
      </div>
    </button>
  );
}

// AI Flow Generator Button Component
function AIFlowGeneratorButton() {
  return (
    <button
      onClick={() => console.log("AI Flow Generator coming soon")}
      disabled={true}
      className="p-6 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group bg-[#1a1a1a] border-gray-800 text-gray-500 cursor-not-allowed"
    >
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-gray-800 text-gray-600">
          <BrainIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-rb mb-1 text-gray-500">AI Flow Generator</h3>
          <p className="text-sm font-rr text-gray-600">
            Generate flows from code
          </p>
        </div>
      </div>

      <div className="absolute top-2 right-2">
        <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded-full font-rm">
          Soon
        </span>
      </div>
    </button>
  );
}

// Main QuickActions Component
export default function QuickActions({
  onNewProject,
  onGitHubImport,
  onConnectGitHub,
  isGitHubConnected,
}: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <NewProjectButton onClick={onNewProject} />

      <GitHubButton
        isConnected={isGitHubConnected}
        onConnect={onConnectGitHub}
        onImport={onGitHubImport}
      />

      <AIFlowGeneratorButton />
    </div>
  );
}

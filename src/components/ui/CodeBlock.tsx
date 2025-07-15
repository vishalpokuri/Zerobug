import { useState } from "react";
import { CheckIcon, CopyIcon } from "../../Svg/Icons";

function CodeBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy command:", err);
    }
  };

  return (
    <div className="relative bg-[#0a0a0a] border border-gray-800/50 rounded-lg p-4 mb-6 overflow-hidden">
      {/* Grainy texture overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3Ccircle cx='19' cy='19' r='1'/%3E%3Ccircle cx='25' cy='25' r='1'/%3E%3Ccircle cx='31' cy='31' r='1'/%3E%3Ccircle cx='37' cy='37' r='1'/%3E%3Ccircle cx='43' cy='43' r='1'/%3E%3Ccircle cx='49' cy='49' r='1'/%3E%3Ccircle cx='55' cy='55' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }}
      />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-gray-800/10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-70" />
            <span className="text-xs text-gray-400 font-mono tracking-wide">
              Terminal Command
            </span>
          </div>
          <button
            onClick={handleCopyCommand}
            className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-yellow-400/10 transition-all duration-200"
          >
            {copied ? (
              <>
                <CheckIcon className="w-3 h-3" />
                <span className="font-medium">Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon className="w-3 h-3" />
                <span className="font-medium">Copy</span>
              </>
            )}
          </button>
        </div>
        
        <div className="bg-black/40 border border-gray-800/60 rounded-md p-3 backdrop-blur-sm">
          <code className="text-gray-100 font-mono text-sm leading-relaxed break-all select-all block">
            <span className="text-yellow-400 opacity-70">$</span>{" "}
            <span className="text-white">{command}</span>
          </code>
        </div>
      </div>
    </div>
  );
}

export default CodeBlock;

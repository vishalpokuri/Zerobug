interface UISwitcherProps {
  currentView: "simple" | "detailed";
  onViewChange: (view: "simple" | "detailed") => void;
}

export function UISwitcher({ currentView, onViewChange }: UISwitcherProps) {
  return (
    <div className="absolute -top-10 right-0 z-20">
      <div className="flex bg-[#2a2a2a] rounded-lg p-1 border border-[#404040] shadow-lg">
        <button
          onClick={() => onViewChange("simple")}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
            currentView === "simple"
              ? "bg-[#4caf50] text-white shadow-sm"
              : "text-[#a0a0a0] hover:text-white hover:bg-[#3a3a3a]"
          }`}
        >
          Simple
        </button>
        <button
          onClick={() => onViewChange("detailed")}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
            currentView === "detailed"
              ? "bg-[#4caf50] text-white shadow-sm"
              : "text-[#a0a0a0] hover:text-white hover:bg-[#3a3a3a]"
          }`}
        >
          Detailed
        </button>
      </div>
    </div>
  );
}
import { useState } from "react";
import { SearchIcon } from "../../Svg/Icons";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = "Search projects...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <SearchIcon className="w-5 h-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent input-focus hover:border-gray-600 placeholder-gray-500 font-rl"
        placeholder={placeholder}
      />
    </div>
  );
}


import React from "react";

interface PrimaryButtonProps {
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function PrimaryButton({
  type = "button",
  disabled = false,
  onClick,
  children,
  className = "",
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg btn-hover disabled:opacity-50 disabled:transform-none shadow-sm hover:shadow-md font-rm cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

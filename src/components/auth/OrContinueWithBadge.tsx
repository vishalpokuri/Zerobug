function OrContinueWithBadge() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-600" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-[#141414] text-gray-400 font-rl">
          Or continue with
        </span>
      </div>
    </div>
  );
}

export default OrContinueWithBadge;

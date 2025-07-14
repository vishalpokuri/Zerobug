function SystemStatusBadge({ status }: { status: "up" | "down" }) {
  return (
    <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-[#2a2a2a] rounded-lg">
      <div
        className={`w-2 h-2 ${
          status === "up" ? "bg-green-500" : "bg-red-500"
        } rounded-full`}
      ></div>
      <span className="text-sm text-gray-300 font-rm">
        {status === "up" ? "All systems operational" : "Server downtime"}
      </span>
    </div>
  );
}

export default SystemStatusBadge;

import {
  GithubIcon,
  FolderIcon,
  LightningIcon,
  ClockIcon,
  ArrowRightIcon,
} from "../../Svg/Icons";

interface Project {
  id: string;
  name: string;
  lastEdited: string;
  type: "local" | "github";
  description?: string;
  routes?: number;
  lastActivity?: string;
  status?: "active" | "idle" | "error";
}

interface ProjectCardProps {
  project: Project;
  onClick: (projectId: string) => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === "github") {
      return <GithubIcon className="w-4 h-4" />;
    }
    return <FolderIcon className="w-4 h-4" />;
  };

  return (
    <div
      onClick={() => onClick(project.id)}
      className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 cursor-pointer card-hover group relative overflow-hidden"
    >
      {/* Subtle noise overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

      {/* Status indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}
        />
        <span className="text-xs text-gray-500 font-rm">
          {project.status || "idle"}
        </span>
      </div>

      {/* Project header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-[#2a2a2a] rounded-lg text-gray-400 group-hover:text-yellow-400 transition-colors">
          {getTypeIcon(project.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-rb text-white truncate">
            {project.name}
          </h3>
          <p className="text-sm text-gray-400 font-rr">
            {project.description || "No description"}
          </p>
        </div>
      </div>

      {/* Project stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <LightningIcon className="w-4 h-4" />
          <span className="font-rm">{project.routes || 0} routes</span>
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon className="w-4 h-4" />
          <span className="font-rm">{project.lastEdited}</span>
        </div>
      </div>

      {/* Action button */}
      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-full font-rm">
          {project.type}
        </span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRightIcon className="w-5 h-5 text-yellow-400" />
        </div>
      </div>
    </div>
  );
}

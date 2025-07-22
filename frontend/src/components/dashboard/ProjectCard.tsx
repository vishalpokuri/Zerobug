import { useState } from "react";
import {
  GithubIcon,
  FolderIcon,
  LightningIcon,
  ClockIcon,
  ArrowRightIcon,
  MoreVerticalIcon,
} from "../../Svg/Icons";
import { formatTimeAgo } from "../../utils/time";
import { EditProjectModal } from "../modals/EditProjectModal";
import { DeleteProjectModal } from "../modals/DeleteProjectModal";

interface Project {
  id: string;
  name: string;
  lastEdited: string;
  type: "local" | "github";
  description?: string;
  endpoints?: Array<Record<string, any>>;
  lastActivity?: string;
  status?: "active" | "idle" | "error";
}

interface ProjectCardProps {
  project: Project;
  onClick: (projectId: string) => void;
  onEdit: (projectId: string, name: string, description: string) => void;
  onDelete: (projectId: string) => void;
}

export default function ProjectCard({
  project,
  onClick,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);

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

  const handleEdit = (name: string, description: string) => {
    onEdit(project.id, name, description);
    setEditModalOpen(false);
  };

  const handleDelete = () => {
    onDelete(project.id);
    setDeleteModalOpen(false);
  };

  return (
    <>
      <div
        className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 card-hover group relative overflow-hidden"
      >
        {/* Subtle noise overlay */}
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />

        {/* Status indicator and Menu */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}
          />
          <span className="text-xs text-gray-500 font-rm">
            {project.status || "idle"}
          </span>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!isMenuOpen);
              }}
              className="text-gray-400 hover:text-white"
            >
              <MoreVerticalIcon className="w-5 h-5" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#2a2a2a] border border-gray-700 rounded-md shadow-lg z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditModalOpen(true);
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                >
                  Edit Project
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteModalOpen(true);
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                >
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Project header */}
        <div
          onClick={() => onClick(project.id)}
          className="cursor-pointer"
        >
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

          {/* Project stats routes and last edited*/}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <LightningIcon className="w-4 h-4" />
              <span className="font-rm">
                {project.endpoints!.length || 0} routes
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              <span className="font-rm">{formatTimeAgo(project.lastEdited)}</span>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded-full font-rm">
              {project.type != null ? project.type : "local"}
            </span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRightIcon className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleEdit}
        currentName={project.name}
        currentDescription={project.description || ""}
      />
      <DeleteProjectModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}

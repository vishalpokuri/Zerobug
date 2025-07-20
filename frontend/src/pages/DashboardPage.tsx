import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import SearchBar from "../components/dashboard/SearchBar";
import ProjectCard from "../components/dashboard/ProjectCard";
import QuickActions from "../components/dashboard/QuickActions";
import ZerobugLogo from "../components/ZerobugLogo";
import SystemStatusBadge from "../components/dashboard/SystemStatusBadge";
import { SearchIcon } from "../Svg/Icons";
import { CreateProjectModal } from "../components/modals/CreateProjectModal";

interface Project {
  _id: string;
  name: string;
  lastEdited: string;
  description?: string;
  endpoints: any[];
  type: "local" | "github";
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const decodedToken: { id: string } = jwtDecode(token);
        const userId = decodedToken.id;

        const response = await fetch(
          `http://localhost:3001/api/project/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok) {
          setProjects(data.projects);
        } else {
          toast.error(data.error || "An error occurred");
        }
      } catch (error) {
        toast.error("An error occurred");
      }
    };

    fetchProjects();
  }, [navigate]);

  const isGitHubConnected = localStorage.getItem("githubConnected") === "true";
  // const isGitHubConnected = false;

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("githubConnected");
    navigate("/login");
  };

  const handleProjectClick = (projectId: string) => {
    navigate(`/canvas/${projectId}`);
  };

  const handleNewProject = () => {
    setIsModalOpen(true);
  };

  const handleCreateProject = async (name: string, description: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const decodedToken: { id: string } = jwtDecode(token);
    const userId = decodedToken.id;

    try {
      const createProjectPromise = fetch(
        "http://localhost:3001/api/project/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            description,
            userId,
          }),
        }
      ).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error);
        }
        return data;
      });
      toast.promise(createProjectPromise, {
        loading: "Creating project...",
        success: (data) => {
          const newProject: Project = {
            _id: data.projectId,
            name,
            description,
            lastEdited: new Date().toISOString(),
            endpoints: [],
            type: "local",
          };
          setProjects([newProject, ...projects]);
          setIsModalOpen(false);
          return "Project created successfully!";
        },
        error: (err) => err.message,
      });
    } catch (e) {
      console.log(e);
    }
  };

  const handleGitHubImport = () => {
    navigate("/import");
  };

  const handleConnectGitHub = () => {
    setTimeout(() => {
      localStorage.setItem("githubConnected", "true");
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#141414] relative">
      {/* Global noise overlay */}
      <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none" />

      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <ZerobugLogo />
              <div className="hidden md:flex items-center gap-6 ml-8">
                <span className="text-sm text-gray-400 font-rr">Dashboard</span>
                <span className="text-sm text-gray-600 font-rr">•</span>
                <span className="text-sm text-gray-600 font-rr cursor-not-allowed">
                  Canvas
                </span>
                <span className="text-sm text-gray-600 font-rr">•</span>
                <span className="text-sm text-gray-600 font-rr cursor-not-allowed">
                  Analytics
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <SystemStatusBadge status={"up"} />

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-rm text-gray-300">#</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-gray-400 hover:text-white text-sm font-rm transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-3xl font-rbi text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 font-rr">
            Debug smarter. Ship faster. Build with flow.
          </p>
        </div>

        {/* Search and filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 max-w-lg">
              <SearchBar
                onSearch={setSearchQuery}
                placeholder="Search projects, routes, or descriptions..."
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-sm font-rm text-gray-400 hover:text-white transition-colors">
                All Projects
              </button>
              <span className="text-gray-600">•</span>
              <button className="px-3 py-2 text-sm font-rm text-gray-400 hover:text-white transition-colors">
                Active
              </button>
              <span className="text-gray-600">•</span>
              <button className="px-3 py-2 text-sm font-rm text-gray-400 hover:text-white transition-colors">
                GitHub
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h3 className="text-lg font-rb text-white mb-4">Quick Actions</h3>
          <QuickActions
            onNewProject={handleNewProject}
            onGitHubImport={handleGitHubImport}
            onConnectGitHub={handleConnectGitHub}
            isGitHubConnected={isGitHubConnected}
          />
        </div>

        {/* Projects section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-rb text-white">
              Projects ({filteredProjects.length})
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="font-rm">Sort by:</span>
              <button className="font-rm hover:text-white transition-colors">
                Recent
              </button>
              <span className="text-gray-600">•</span>
              <button className="font-rm hover:text-white transition-colors">
                Name
              </button>
              <span className="text-gray-600">•</span>
              <button className="font-rm hover:text-white transition-colors">
                Status
              </button>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#2a2a2a] rounded-full flex items-center justify-center">
                <SearchIcon className="w-8 h-8 text-gray-500" />
              </div>
              <h4 className="text-lg font-rb text-gray-300 mb-2">
                {searchQuery ? "No projects found" : "No projects yet"}
              </h4>
              <p className="text-gray-500 mb-6 font-rr max-w-md mx-auto">
                {searchQuery
                  ? `No projects match "${searchQuery}". Try adjusting your search.`
                  : "Create your first project to start debugging APIs with visual flows."}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleNewProject}
                  className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-rm rounded-lg btn-hover"
                >
                  Create Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={{ ...project, id: project._id }}
                  onClick={handleProjectClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats footer */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-rb text-white mb-1">
                {projects.length}
              </div>
              <div className="text-sm text-gray-500 font-rr">
                Total Projects
              </div>
            </div>
            <div>
              <div className="text-2xl font-rb text-white mb-1">
                {projects.reduce(
                  (sum, p) => sum + (p.endpoints.length || 0),
                  0
                )}
              </div>
              <div className="text-sm text-gray-500 font-rr">Total Routes</div>
            </div>
            <div>
              <div className="text-2xl font-rb text-white mb-1">
                {projects.filter((p) => p).length}
              </div>
              <div className="text-sm text-gray-500 font-rr">
                Active Projects
              </div>
            </div>
            <div>
              <div className="text-2xl font-rb text-white mb-1">
                {projects.filter((p) => p.type === "github").length}
              </div>
              <div className="text-sm text-gray-500 font-rr">
                GitHub Projects
              </div>
            </div>
          </div>
        </div>
      </main>
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}

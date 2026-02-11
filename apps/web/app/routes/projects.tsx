import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ProjectCard } from "~/components/ProjectCard";
import { Button } from "~/components/Button";
import { Spinner } from "~/components/Spinner";
import { ErrorComp } from "~/components/Error";
import { PageErrorBoundary } from "~/components/PageErrorBoundary";
import { getAllCompositions, createComposition, type VideoComposition } from "~/lib/api";
import { useToast } from "~/lib/toast-context";
import type { WarehouseVideoProps } from "@repo/shared";

function ProjectsPageContent() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [projects, setProjects] = useState<VideoComposition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all compositions on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const compositions = await getAllCompositions();
      setProjects(compositions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load projects";
      setError(errorMessage);
      showError("Failed to load projects", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      setIsCreating(true);
      setError(null);

      // Create default composition data
      const defaultComposition: WarehouseVideoProps = {
        intro: {
          clientName: "New Project",
          projectLocationName: "Location TBD",
        },
        satDroneSection: {
          location: { lat: 28.4744, lng: 77.5040 },
          droneVideoUrl: "",
          satelliteImageUrl: "",
          audio: {
            audioUrl: "",
            durationInSeconds: 5,
            transcript: "",
          },
        },
        locationSection: {
          nearbyPoints: [],
          approachRoadVideoUrl: "",
          audio: {
            audioUrl: "",
            durationInSeconds: 5,
            transcript: "",
          },
        },
        internalSection: {
          wideShotVideoUrl: "",
          specs: {
            clearHeight: "",
            flooringType: "",
            hasVentilation: false,
            hasInsulation: false,
            rackingType: "",
          },
          internalDockVideoUrl: "",
          utilities: {
            videoUrl: "",
            featuresPresent: [],
          },
          audio: {
            audioUrl: "",
            durationInSeconds: 5,
            transcript: "",
          },
        },
        dockingSection: {
          dockPanVideoUrl: "",
          dockCount: 0,
          audio: {
            audioUrl: "",
            durationInSeconds: 5,
            transcript: "",
          },
        },
        complianceSection: {
          fireSafetyVideoUrl: "",
          safetyFeatures: [],
          audio: {
            audioUrl: "",
            durationInSeconds: 5,
            transcript: "",
          },
        },
      };

      const newProject = await createComposition(defaultComposition);
      showSuccess("Project created", "Your new project has been created successfully");
      navigate(`/editor/${newProject.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create project";
      setError(errorMessage);
      showError("Failed to create project", errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-gray-600 mt-1">Manage your video composition projects</p>
          </div>
          <Button
            onClick={handleCreateProject}
            loading={isCreating}
            disabled={isCreating}
          >
            Create New Project
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6">
            <ErrorComp message={error} />
            {!isLoading && (
              <Button
                onClick={loadProjects}
                secondary
                className="mt-4"
              >
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size={40} />
            <p className="text-gray-600 mt-4">Loading projects...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-foreground mb-2">No projects yet</h2>
            <p className="text-gray-600 mb-6">Get started by creating your first video project</p>
            <Button onClick={handleCreateProject} loading={isCreating}>
              Create Your First Project
            </Button>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                createdAt={project.created_at}
                compositionComponents={project.composition_components}
                onDelete={loadProjects}
                onDuplicate={loadProjects}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


export default function ProjectsPage() {
  return (
    <PageErrorBoundary pageName="Projects">
      <ProjectsPageContent />
    </PageErrorBoundary>
  );
}

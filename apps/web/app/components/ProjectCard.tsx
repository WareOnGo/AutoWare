import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { DeleteConfirmationModal } from "~/components/DeleteConfirmationModal";
import { LoadingOverlay } from "~/components/LoadingOverlay";
import { deleteComposition, duplicateComposition } from "~/lib/api";
import { useToast } from "~/lib/toast-context";
import type { WarehouseVideoProps } from "@repo/shared";

interface ProjectCardProps {
  id: string;
  createdAt: string;
  compositionComponents: WarehouseVideoProps;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export function ProjectCard({ id, createdAt, compositionComponents, onDelete, onDuplicate }: ProjectCardProps) {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Extract display data
  const shortId = id.substring(0, 8);
  const clientName = compositionComponents.intro?.clientName || "Untitled Project";
  const locationName = compositionComponents.intro?.projectLocationName || "Location not set";
  
  // Format date
  const date = new Date(createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleClick = () => {
    navigate(`/editor/${id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setIsDeleteModalOpen(true);
  };

  const handleDuplicateClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      setIsDuplicating(true);
      await duplicateComposition(id);
      showSuccess("Project duplicated", `${locationName} has been duplicated successfully`);
      
      // Notify parent to refresh the list
      if (onDuplicate) {
        onDuplicate();
      }
    } catch (error) {
      console.error("Failed to duplicate project:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to duplicate project";
      showError("Duplicate failed", errorMessage);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await deleteComposition(id);
      showSuccess("Project deleted", `${locationName} has been deleted successfully`);
      setIsDeleteModalOpen(false);
      
      // Notify parent to refresh the list
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete project";
      showError("Delete failed", errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        className="cursor-pointer transition-all hover:shadow-md hover:border-gray-300 relative"
        onClick={handleClick}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{clientName}</CardTitle>
              <CardDescription>{locationName}</CardDescription>
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleDuplicateClick}
                disabled={isDuplicating}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Duplicate project"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button
                onClick={handleDeleteClick}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete project"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1 text-sm text-gray-600">
            <div>
              <span className="font-medium">ID:</span> {shortId}
            </div>
            <div>
              <span className="font-medium">Created:</span> {formattedDate}
            </div>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        projectName={locationName}
        isDeleting={isDeleting}
      />

      {isDuplicating && <LoadingOverlay message="Duplicating project..." />}
    </>
  );
}

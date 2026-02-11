import { useState } from "react";
import { Button } from "./Button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
  isDeleting?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  const [inputValue, setInputValue] = useState("");
  const isConfirmEnabled = inputValue === projectName;

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isConfirmEnabled) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setInputValue("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            This action cannot be undone. This will permanently delete the project and all associated data.
          </p>
          <p className="text-sm text-gray-900 mb-2">
            Please type <span className="font-semibold">{projectName}</span> to confirm:
          </p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={projectName}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={isDeleting}
            autoFocus
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            onClick={handleClose}
            variant="secondary"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300"
          >
            {isDeleting ? "Deleting..." : "Delete Project"}
          </Button>
        </div>
      </div>
    </div>
  );
}

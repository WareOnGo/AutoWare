import { Spinner } from "./Spinner";

interface LoadingOverlayProps {
  message?: string;
  size?: number;
}

export function LoadingOverlay({ message = "Loading...", size = 40 }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
        <Spinner size={size} />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

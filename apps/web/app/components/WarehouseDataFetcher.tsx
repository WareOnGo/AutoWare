import React, { useState } from "react";
import { Input } from "~/components/ui/input";
import { Button2 } from "~/components/ui/button2";
import { Label } from "~/components/ui/label";
import { getWarehouseById, WarehouseResponse } from "~/lib/api";

export interface WarehouseDataFetcherProps {
  onDataFetched: (warehouseData: WarehouseResponse) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const WarehouseDataFetcher: React.FC<WarehouseDataFetcherProps> = ({
  onDataFetched,
  onError,
  disabled = false,
}) => {
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>("");

  const validateInput = (value: string): string | null => {
    if (!value || value.trim() === "") {
      return "Warehouse ID is required";
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return "Warehouse ID must be a number";
    }

    if (numValue < 0) {
      return "Warehouse ID must be positive";
    }

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWarehouseId(value);
    
    // Clear validation error when user types
    if (validationError) {
      setValidationError("");
    }
  };

  const handleFetchData = async () => {
    // Validate input
    const error = validateInput(warehouseId);
    if (error) {
      setValidationError(error);
      return;
    }

    setIsFetching(true);
    setValidationError("");

    try {
      const id = Number(warehouseId);
      console.log(`Fetching warehouse data for ID: ${id}`);
      
      const data = await getWarehouseById(id);
      console.log("Warehouse data fetched successfully:", data);
      
      onDataFetched(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error fetching warehouse data:", errorMessage);
      
      // Map error messages to user-friendly versions
      let userFriendlyMessage = errorMessage;
      
      if (errorMessage.includes("not found") || errorMessage.includes("404")) {
        userFriendlyMessage = `Warehouse not found with ID ${warehouseId}`;
      } else if (errorMessage.includes("Invalid request") || errorMessage.includes("400")) {
        userFriendlyMessage = "Invalid warehouse ID";
      } else if (errorMessage.includes("Server error") || errorMessage.includes("500")) {
        userFriendlyMessage = "Server error: Unable to fetch warehouse data";
      } else if (errorMessage.includes("Network error")) {
        userFriendlyMessage = "Network error: Unable to connect to server";
      } else if (errorMessage.includes("timed out")) {
        userFriendlyMessage = "Request timed out. Please try again.";
      }
      
      onError(userFriendlyMessage);
    } finally {
      setIsFetching(false);
    }
  };

  const isButtonDisabled = disabled || isFetching || !warehouseId.trim();

  return (
    <div className="border border-gray-300 rounded-md p-4 mb-4 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <Label htmlFor="warehouse-id" className="block mb-2">
            Warehouse ID
          </Label>
          <Input
            id="warehouse-id"
            type="number"
            value={warehouseId}
            onChange={handleInputChange}
            disabled={disabled || isFetching}
            placeholder="Enter warehouse ID"
            className="w-full"
          />
          {validationError && (
            <p className="text-sm text-red-600 mt-1">{validationError}</p>
          )}
        </div>
        <div className="sm:mt-8">
          <Button2
            onClick={handleFetchData}
            disabled={isButtonDisabled}
            loading={isFetching}
            className="w-full sm:w-auto"
          >
            {isFetching ? "Fetching..." : "Fetch Data"}
          </Button2>
        </div>
      </div>
    </div>
  );
};

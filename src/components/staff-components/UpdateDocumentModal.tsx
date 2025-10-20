// app/dashboard/components/UpdateDocumentModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface UpdateFormData {
  patientName: string;
  claimNumber: string;
  dob: Date | null;
  doi: string;
}

interface FailedDocument {
  id: string;
  patientName?: string;
  claimNumber?: string;
  dob?: string;
  doi?: string;
  fileName?: string;
  createdAt?: string;
}

interface UpdateDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDoc: FailedDocument | null;
  formData: UpdateFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export default function UpdateDocumentModal({
  open,
  onOpenChange,
  selectedDoc,
  formData,
  onInputChange,
  onSubmit,
  isLoading,
}: UpdateDocumentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogHeader className="bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-t-lg -mx-6 -mt-6 px-6 py-4">
          <DialogTitle className="text-white text-xl font-bold">
            Update Missing Document Info
          </DialogTitle>
          <DialogDescription className="text-blue-100">
            Fill in the missing details for document {selectedDoc?.id}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="patientName" className="text-sm font-medium">
                Patient Name
              </Label>
              <Input
                id="patientName"
                name="patientName"
                value={formData.patientName}
                onChange={onInputChange}
                placeholder="Enter patient name"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claimNumber" className="text-sm font-medium">
                Claim Number
              </Label>
              <Input
                id="claimNumber"
                name="claimNumber"
                value={formData.claimNumber}
                onChange={onInputChange}
                placeholder="Enter claim number"
                className="w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dob" className="text-sm font-medium">
                Date of Birth
              </Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                value={
                  formData.dob ? formData.dob.toISOString().split("T")[0] : ""
                }
                onChange={onInputChange}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doi" className="text-sm font-medium">
                DOI
              </Label>
              <Input
                id="doi"
                name="doi"
                type="date"
                value={formData.doi}
                onChange={onInputChange}
                placeholder="Enter DOI (string)"
                className="w-full"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-3 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isLoading}
            className="bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold hover:from-violet-700 hover:to-purple-600 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Document"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
}

export default function UpdateDocumentModal({
  open,
  onOpenChange,
  selectedDoc,
  formData,
  onInputChange,
  onSubmit,
}: UpdateDocumentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Missing Document Info</DialogTitle>
          <DialogDescription>
            Fill in the missing details for document {selectedDoc?.id}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="patientName" className="text-right">
              Patient Name
            </Label>
            <Input
              id="patientName"
              name="patientName"
              value={formData.patientName}
              onChange={onInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="claimNumber" className="text-right">
              Claim Number
            </Label>
            <Input
              id="claimNumber"
              name="claimNumber"
              value={formData.claimNumber}
              onChange={onInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dob" className="text-right">
              DOB
            </Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              value={
                formData.dob ? formData.dob.toISOString().split("T")[0] : ""
              }
              onChange={onInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="doi" className="text-right">
              DOI
            </Label>
            <Input
              id="doi"
              name="doi"
              value={formData.doi}
              onChange={onInputChange}
              className="col-span-3"
              placeholder="Enter DOI (string)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={onSubmit}>
            Update Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

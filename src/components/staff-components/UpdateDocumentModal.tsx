// app/dashboard/components/UpdateDocumentModal.tsx
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
import { Loader2, AlertCircle, FileText, User, Calendar } from "lucide-react";

interface UpdateFormData {
  patientName: string;
  claimNumber: string;
  dob: Date | string | null;
  doi: string;
  author: string;
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
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleUpdateClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmUpdate = () => {
    setShowConfirmation(false);
    onSubmit();
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleDateChange = (date: Date | null) => {
    const syntheticEvent = {
      target: {
        name: "dob",
        value: date,
      },
    } as any;
    onInputChange(syntheticEvent);
  };

  // Convert string DOB to Date object for DatePicker
  const getDobAsDate = (): Date | null => {
    if (!formData.dob) return null;

    // If it's already a Date object, return it
    if (formData.dob instanceof Date) {
      return formData.dob;
    }

    // If it's a string, parse it
    if (typeof formData.dob === "string") {
      const parsed = new Date(formData.dob);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  };

  const isFormValid = Boolean(
    formData.patientName?.trim() &&
      formData.claimNumber?.trim() &&
      formData.dob &&
      formData.author?.trim()
  );

  return (
    <>
      {/* Main Update Modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[850px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-indigo-800 to-blue-800 text-white rounded-t-lg -mx-6 -mt-6 px-6 py-5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-white text-2xl font-bold">
                  Update Document Information
                </DialogTitle>
                <DialogDescription className="text-indigo-100 mt-1 text-sm">
                  Complete the missing details for document ID:{" "}
                  <span className="font-semibold">{selectedDoc?.id}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-6 py-6 px-1">
            {/* Document File Info */}
            {selectedDoc?.fileName && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-indigo-900 mb-1">
                      Document File
                    </p>
                    <p className="text-sm text-indigo-700 break-all">
                      {selectedDoc.fileName}
                    </p>
                    {selectedDoc.createdAt && (
                      <p className="text-xs text-indigo-600 mt-1">
                        Created:{" "}
                        {new Date(selectedDoc.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Patient Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-2">
                <div className="bg-indigo-100 p-1.5 rounded-lg">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                Patient Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Patient Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="patientName"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-1"
                  >
                    Patient Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="patientName"
                    name="patientName"
                    value={formData.patientName}
                    onChange={onInputChange}
                    placeholder="Enter full patient name"
                    className="w-full border-gray-100 focus:border-indigo-900 focus:ring-indigo-700 transition-colors"
                    disabled={isLoading}
                  />
                </div>

                {/* Claim Number */}
                <div className="space-y-2">
                  <Label
                    htmlFor="claimNumber"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-1"
                  >
                    Claim Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="claimNumber"
                    name="claimNumber"
                    value={formData.claimNumber}
                    onChange={onInputChange}
                    placeholder="Enter claim number"
                    className="w-full border-gray-100 focus:border-indigo-900 focus:ring-indigo-700 transition-colors"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label
                    htmlFor="dob"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-1"
                  >
                    <Calendar className="w-4 h-4" />
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    selected={getDobAsDate()}
                    onChange={handleDateChange}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select date of birth"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    maxDate={new Date()}
                    className="w-full border-gray-100 focus:border-indigo-900 focus:ring-indigo-700 rounded-md"
                    wrapperClassName="w-full"
                    customInput={
                      <Input className="w-full border-gray-100 focus:border-indigo-900 focus:ring-indigo-700" />
                    }
                    disabled={isLoading}
                  />
                </div>

                {/* Author */}
                <div className="space-y-2">
                  <Label
                    htmlFor="author"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-1"
                  >
                    Author <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={onInputChange}
                    placeholder="Enter document author name"
                    className="w-full border-gray-100 focus:border-indigo-900 focus:ring-indigo-700 transition-colors"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Required Fields Note */}
            <div className="text-xs text-gray-500 flex items-center gap-1.5 pt-2">
              <span className="text-red-500">*</span>
              <span>Required fields</span>
            </div>
          </div>

          <DialogFooter className="gap-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleUpdateClick}
              disabled={isLoading || !isFormValid}
              className="bg-gradient-to-r from-indigo-800 to-blue-800 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
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

      {/* Confirmation Modal */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg -mx-6 -mt-6 px-6 py-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <DialogTitle className="text-white text-xl font-bold">
                Confirm Update
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="py-6 px-1">
            <p className="text-gray-700 text-base leading-relaxed mb-4">
              Are you sure you want to update this document with the following
              information?
            </p>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 space-y-3 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  Patient:
                </span>
                <span className="text-gray-900 font-medium">
                  {formData.patientName}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Claim #:
                </span>
                <span className="text-gray-900 font-medium">
                  {formData.claimNumber}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  DOB:
                </span>
                <span className="text-gray-900 font-medium">
                  {(() => {
                    if (!formData.dob) return "N/A";
                    const dateObj = getDobAsDate();
                    if (!dateObj) return String(formData.dob);
                    return dateObj.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  Author:
                </span>
                <span className="text-gray-900 font-medium">
                  {formData.author}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-4 italic">
              This action will permanently update the document information.
            </p>
          </div>

          <DialogFooter className="gap-3 bg-gray-50 border-t border-gray-200 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelConfirmation}
              className="border-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmUpdate}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              Yes, Update Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

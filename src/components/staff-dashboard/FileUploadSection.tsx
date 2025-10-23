// components/dashboard/FileUploadSection.tsx
import { useRef } from "react";
import { Session } from "next-auth";

interface FileUploadSectionProps {
  session: Session | null;
  uploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  snapInputRef: React.RefObject<HTMLInputElement>;
  createSnapLinkButtonRef: React.RefObject<HTMLButtonElement>;
}

export default function FileUploadSection({
  session,
  uploading,
  onFileChange,
  snapInputRef,
  createSnapLinkButtonRef,
}: FileUploadSectionProps) {
  return (
    session?.user?.role === "Staff" && (
      <div className="p-6">
        <button
          ref={createSnapLinkButtonRef}
          className="fixed top-6 left-[5vw] bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-4 px-7 rounded-full text-base shadow-xl cursor-pointer transition-all duration-300 z-10 hover:-translate-y-0.5 hover:shadow-2xl before:content-['⚡_'] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => snapInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </span>
          ) : (
            "Create DocLatch"
          )}
        </button>
        <input
          type="file"
          ref={snapInputRef}
          multiple
          className="hidden"
          onChange={onFileChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
      </div>
    )
  );
}

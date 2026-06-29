'use client';

import React, { useEffect, useRef, useState } from 'react';
import useDrivePicker from 'react-google-drive-picker';
import { HardDrive, Loader2 } from 'lucide-react';

interface DrivePickerProps {
  onFileLoaded: (file: File) => void;
}

export default function DrivePicker({ onFileLoaded }: DrivePickerProps) {
  const [openPicker, authResponse] = useDrivePicker();
  const tokenRef = useRef<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (authResponse?.access_token) {
      tokenRef.current = authResponse.access_token;
    }
  }, [authResponse]);

  const handleOpenPicker = () => {
    openPicker({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      developerKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      viewId: 'PDFS',
      showUploadView: false,
      showUploadFolders: false,
      supportDrives: true,
      multiselect: false,
      callbackFunction: async (data) => {
        if (data.action === 'picked' && data.docs && data.docs.length > 0) {
          const doc = data.docs[0];
          const fileId = doc.id;
          const fileName = doc.name;
          
          if (!tokenRef.current) {
            alert("Authentication token missing. Please try again.");
            return;
          }

          setIsDownloading(true);
          try {
            // Download the file content from Google Drive
            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
              headers: {
                Authorization: `Bearer ${tokenRef.current}`
              }
            });

            if (!response.ok) {
              throw new Error(`Failed to download file: ${response.statusText}`);
            }

            const blob = await response.blob();
            const file = new File([blob], fileName, { type: 'application/pdf' });
            onFileLoaded(file);
          } catch (error) {
            console.error("Error downloading from Drive:", error);
            alert("Failed to download the file from Google Drive. Ensure you have the correct permissions.");
          } finally {
            setIsDownloading(false);
          }
        }
      }
    });
  };

  return (
    <button
      onClick={handleOpenPicker}
      disabled={isDownloading}
      className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-[var(--color-panel-border)] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[var(--color-brand-teal)] transition-all group w-full sm:w-auto"
    >
      {isDownloading ? (
        <Loader2 size={24} className="animate-spin text-[var(--color-brand-teal)]" />
      ) : (
        <HardDrive size={24} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-brand-teal)] transition-colors" />
      )}
      <div className="text-left">
        <p className="font-medium text-[var(--color-text-primary)] group-hover:text-white transition-colors">
          {isDownloading ? "Downloading..." : "Import from Google Drive"}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Browse your cloud PDFs
        </p>
      </div>
    </button>
  );
}

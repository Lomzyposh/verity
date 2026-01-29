import React from "react";

export default function LoaderSpinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-black border-t-transparent animate-spin" />
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

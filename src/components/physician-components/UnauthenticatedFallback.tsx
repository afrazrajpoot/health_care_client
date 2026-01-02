import React from "react";

export const UnauthenticatedFallback = React.memo(() => (
  <div className="min-h-screen flex items-center justify-center">
    <p>Please sign in to access the physician card.</p>
  </div>
));
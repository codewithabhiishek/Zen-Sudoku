import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ClerkProvider } from "@clerk/clerk-react";
import { getRouter } from "./router";
import "./styles.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const router = getRouter();
const rootElement = document.getElementById("root")!;
const root = ReactDOM.createRoot(rootElement);

if (PUBLISHABLE_KEY) {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <RouterProvider router={router} />
        <Analytics />
        <SpeedInsights />
      </ClerkProvider>
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
      <Analytics />
      <SpeedInsights />
    </React.StrictMode>
  );
}

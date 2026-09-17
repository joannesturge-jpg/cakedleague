import type { MetadataRoute } from "next";

// Auto-served at /manifest.webmanifest by Next's file-based metadata
// convention. This branch is for internal PWA testing only — icons are
// the existing 100x100 favicon stretched up as a placeholder until there's
// a proper high-res logo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Caked Leagues",
    short_name: "Caked",
    description: "Draft anything. Even the weird stuff.",
    start_url: "/",
    display: "standalone",
    background_color: "#1C0F2E",
    theme_color: "#1C0F2E",
    icons: [
      { src: "/icon.png", sizes: "100x100", type: "image/png" },
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

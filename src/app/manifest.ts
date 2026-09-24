import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Acasia FinTrack",
    short_name: "FinTrack",
    description: "Automated Financial Intelligence & Cash Flow Tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#090d16",
    theme_color: "#090d16",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "https://placehold.co/192x192/090d16/38bdf8.png?text=AF",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "https://placehold.co/512x512/090d16/38bdf8.png?text=AF",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

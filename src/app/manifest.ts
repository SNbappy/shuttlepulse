import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShuttlePulse — Badminton Club & Player Rankings",
    short_name: "ShuttlePulse",
    description:
      "Mobile-first Badminton Club App: 500 TK Welcome Tokens, Session Attendance & Shuttle Cost Split, 25-Question Weekly Survey, Bayesian Rankings & Public Donor Wall.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#090d16",
    theme_color: "#090d16",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProSelect Fleet & Industrial Solutions",
    short_name: "ProSelect",
    description: "Premium B2B Procurement & International Manufacturer Representation Platform",
    start_url: "/",
    display: "standalone",
    background_color: "#002545",
    theme_color: "#002545",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/brand/proselect_logo_blue.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

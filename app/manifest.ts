import type { MetadataRoute } from "next"
import { SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from "@/lib/site"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} - NES Games in Your Browser`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "fullscreen",
    orientation: "any",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    categories: ["games", "entertainment"],
    icons: [
      { src: "/nostanes.png", sizes: "1254x1254", type: "image/png", purpose: "any" },
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  }
}

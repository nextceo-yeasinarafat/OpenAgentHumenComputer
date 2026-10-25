import type { CSSProperties } from "react";




export const WALLPAPER_URL = "/wallpaper/openhumencomputer-x2.jpeg";


const DOTS = "radial-gradient(#2f3136 1px, transparent 1.4px)";


export function wallpaperStyle(): CSSProperties {
  return {
    position: "relative",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    backgroundColor: "#000000",
    backgroundImage: `url(${WALLPAPER_URL}), ${DOTS}`,
    backgroundSize: "cover, 48px 48px",
    backgroundPosition: "center, top left",
    backgroundRepeat: "no-repeat, repeat",
  };
}

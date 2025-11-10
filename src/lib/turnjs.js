// src/lib/turn.js
import $ from "jquery";

// Load Turn.js dynamically only in the browser
if (typeof window !== "undefined") {
  await import("turn.js"); // ES module dynamic import (Vite supports this)
}

// After it's loaded, Turn.js will attach itself to jQuery automatically
export default $;

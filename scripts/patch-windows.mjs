#!/usr/bin/env node

import os from "node:os";

try {
  const isWin = os.platform() === "win32";
  const prev = process.env.NODE_OPTIONS || "";
  const addMem = "--max-old-space-size=4096";
  if (!prev.includes(addMem)) {
    process.env.NODE_OPTIONS = `${prev} ${addMem}`.trim();
  }
  if (isWin) {
    process.env.CHOKIDAR_USEPOLLING = process.env.CHOKIDAR_USEPOLLING || "1";
  }
  console.log("[BuildDoctor] Windows patch applied.",
    { NODE_OPTIONS: process.env.NODE_OPTIONS, CHOKIDAR_USEPOLLING: process.env.CHOKIDAR_USEPOLLING });
} catch (e) {
  console.warn("[BuildDoctor] Windows patch failed silently:", e?.message || e);
}

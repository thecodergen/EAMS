"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeId =
  | "light"
  | "dark"
  | "ocean"
  | "sunset"
  | "forest"
  | "galaxy";

export type Theme = {
  id: ThemeId;
  label: string;
  emoji: string;
  description: string;
  preview: string[];   // [bg, sidebar, accent]
};

export const THEMES: Theme[] = [
  {
    id: "light",
    label: "Light",
    emoji: "☀️",
    description: "Clean white professional look",
    preview: ["#f5f7fb", "#1e293b", "#2563eb"],
  },
  {
    id: "dark",
    label: "Dark",
    emoji: "🌙",
    description: "Sleek dark interface — easier on eyes",
    preview: ["#0f172a", "#020617", "#6366f1"],
  },
  {
    id: "ocean",
    label: "Ocean",
    emoji: "🌊",
    description: "Deep sea blue & teal tones",
    preview: ["#e0f2fe", "#0c4a6e", "#0891b2"],
  },
  {
    id: "sunset",
    label: "Sunset",
    emoji: "🌅",
    description: "Warm orange and rose gradients",
    preview: ["#fff7ed", "#431407", "#ea580c"],
  },
  {
    id: "forest",
    label: "Forest",
    emoji: "🌿",
    description: "Earthy green — calm and focused",
    preview: ["#f0fdf4", "#14532d", "#16a34a"],
  },
  {
    id: "galaxy",
    label: "Galaxy",
    emoji: "🪐",
    description: "Deep purple cosmic vibes",
    preview: ["#1e1b4b", "#0f0a1e", "#a855f7"],
  },
];

type ThemeContextType = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themeInfo: Theme;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  themeInfo: THEMES[0],
});

const STORAGE_KEY = "eams_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("light");

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeId) || "light";
    setThemeState(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  function setTheme(newTheme: ThemeId) {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }

  const themeInfo = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeInfo }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const THEMES = ["rosa", "salvia", "lila", "celeste"];

export const PALETTE_META = {
  celeste: {
    label: "Original",
    description: "",
    bg: "#f0f7fb",
    tint: "#d9eef5",
    brand600: "#2785aa",
    brand200: "#aad3e8",
    brand50: "#f0f7fb",
  },
  rosa: {
    label: "Rosa",
    description: "",
    bg: "#fef8f7",
    tint: "#fde8e3",
    brand600: "#c96b61",
    brand200: "#fbc5bf",
    brand50: "#fdf2f1",
  },
  salvia: {
    label: "Salvia",
    description: "",
    bg: "#f4f8f5",
    tint: "#ddeee1",
    brand600: "#507758",
    brand200: "#b5d5bb",
    brand50: "#edf5ef",
  },
  lila: {
    label: "Lila",
    description: "",
    bg: "#f6f4fb",
    tint: "#e4dff5",
    brand600: "#6357aa",
    brand200: "#c2bcea",
    brand50: "#eeecf8",
  },
};
const LS_KEY = "subsmanager_theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem(LS_KEY);
    return THEMES.includes(stored) ? stored : "celeste";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(LS_KEY, theme);
  }, [theme]);

  async function setTheme(newTheme, businessId) {
    if (!THEMES.includes(newTheme)) return;
    setThemeState(newTheme);
    if (businessId) {
      await supabase
        .from("businesses")
        .update({ theme: newTheme })
        .eq("id", businessId);
    }
  }

  function syncFromBusiness(business) {
    if (business?.theme && THEMES.includes(business.theme)) {
      setThemeState(business.theme);
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, syncFromBusiness }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

export { THEMES };

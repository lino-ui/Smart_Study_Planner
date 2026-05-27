import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from "next-themes";
import React from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "smart-study-theme",
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      {...props}
    >
      {children}
    </NextThemeProvider>
  );
}

export const useTheme = () => {
  const { theme, setTheme } = useNextTheme();
  return {
    theme: theme as Theme,
    setTheme: (newTheme: Theme) => setTheme(newTheme),
  };
};

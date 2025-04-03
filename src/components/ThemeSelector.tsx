
import React from "react";
import { useNotes, THEMES } from "@/context/NotesContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Palette } from "lucide-react";

export const ThemeSelector: React.FC = () => {
  const { currentTheme, setCurrentTheme } = useNotes();

  const getThemeIcon = () => {
    switch (currentTheme) {
      case THEMES.DARK:
        return <Moon className="h-4 w-4" />;
      case THEMES.LIGHT:
        return <Sun className="h-4 w-4" />;
      default:
        return <Palette className="h-4 w-4" />;
    }
  };

  const getThemeName = (theme: string) => {
    switch (theme) {
      case THEMES.LIGHT:
        return "Light";
      case THEMES.DARK:
        return "Dark";
      case THEMES.SEPIA:
        return "Sepia";
      case THEMES.NORD:
        return "Nord";
      case THEMES.DRACULA:
        return "Dracula";
      default:
        return theme;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {getThemeIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.values(THEMES).map((theme) => (
          <DropdownMenuItem
            key={theme}
            onClick={() => setCurrentTheme(theme)}
            className={currentTheme === theme ? "bg-accent" : ""}
          >
            {getThemeName(theme)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

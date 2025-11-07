import { ThemeToggle } from "../ThemeToggle";
import { ThemeProvider } from "@/hooks/use-theme";

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="p-8">
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}

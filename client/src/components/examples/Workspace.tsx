import WorkspacePage from "../../pages/workspace";
import { ThemeProvider } from "@/hooks/use-theme";

export default function WorkspaceExample() {
  return (
    <ThemeProvider>
      <WorkspacePage />
    </ThemeProvider>
  );
}

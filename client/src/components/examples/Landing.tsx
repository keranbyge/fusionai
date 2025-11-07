import Landing from "../../pages/landing";
import { ThemeProvider } from "@/hooks/use-theme";

export default function LandingExample() {
  return (
    <ThemeProvider>
      <Landing />
    </ThemeProvider>
  );
}

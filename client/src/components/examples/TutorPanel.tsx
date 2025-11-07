import { TutorPanel } from "../TutorPanel";

export default function TutorPanelExample() {
  return (
    <div className="h-screen">
      <TutorPanel onClose={() => console.log("Close clicked")} />
    </div>
  );
}

import { CoderPanel } from "../CoderPanel";

export default function CoderPanelExample() {
  return (
    <div className="h-screen">
      <CoderPanel workspaceId="demo-workspace" onClose={() => console.log("Close clicked")} />
    </div>
  );
}

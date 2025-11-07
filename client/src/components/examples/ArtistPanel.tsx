import { ArtistPanel } from "../ArtistPanel";

export default function ArtistPanelExample() {
  return (
    <div className="h-screen">
      <ArtistPanel workspaceId="demo-workspace" onClose={() => console.log("Close clicked")} />
    </div>
  );
}

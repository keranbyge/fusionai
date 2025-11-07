import { ArtistPanel } from "../ArtistPanel";

export default function ArtistPanelExample() {
  return (
    <div className="h-screen">
      <ArtistPanel onClose={() => console.log("Close clicked")} />
    </div>
  );
}

import type { Tile } from "@/lib/types";

interface TileCoverageInfoProps {
  tile: Tile | null;
  fetchedAt: string | null;
}

export default function TileCoverageInfo({
  tile,
  fetchedAt,
}: TileCoverageInfoProps) {
  if (tile === null) return null;

  return (
    <p className="text-xs text-ink-subtle">
      Tile {tile.id} · fetched {fetchedAt ?? "—"} · hours{" "}
      {tile.hours_fetched.join(", ")}
    </p>
  );
}

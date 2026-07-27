import { customType } from "drizzle-orm/pg-core";

// Drizzle has no native postgis support; these wrap the raw SQL type so
// migrations get a real `geography(...)` column. Data is passed/read as
// WKT text (e.g. `POINT(-77.98 45.14)`) — no application code writes to
// these columns yet in this change.
//
// Known drizzle-kit gotcha: its generator's native-type allowlist includes
// `geometry` but not `geography`, so `drizzle-kit generate` wraps this
// type in double quotes (producing an invalid `"geography(Point,4326)"`
// identifier instead of a type expression). Any migration generated after
// a change to a geography column must be hand-fixed to strip those quotes
// before applying.
export const geographyPoint = customType<{ data: string }>({
  dataType() {
    return "geography(Point,4326)";
  },
});

export const geographyPolygon = customType<{ data: string }>({
  dataType() {
    return "geography(Polygon,4326)";
  },
});

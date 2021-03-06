import { Feature, MultiPolygon, Point, Polygon } from "@turf/helpers";
import { LocationPoint } from "renderer/types";
import * as turf from "@turf/turf";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

import { getCountryShape, getMunicipalityShapes, getWorkarea } from "../util";

export type CalculateRandomPointsParams = {
  count: number;
  municipalityIds: string[];
};

export type CalculateRandomPointsResult = {
  points: LocationPoint[];
};

export async function calculateRandomPoints({ count, municipalityIds }: CalculateRandomPointsParams) {
  const _MAX_TRIES = count * 100;
  //return variables;
  let points: LocationPoint[] = [];

  let municipalityShapes = await getMunicipalityShapes(municipalityIds);
  let workArea;
  if (municipalityIds && municipalityIds.length > 0) {
    workArea = getWorkarea(municipalityShapes);
  } else {
    let countryShape = await getCountryShape();
    const countryFeature = countryShape.features[0] as Feature<MultiPolygon>;
    workArea = countryFeature;
  }

  var bbox = turf.bbox(workArea);

  for (let i = 0; i < _MAX_TRIES; i++) {
    let fc = turf.randomPoint(1, { bbox });
    let point = fc.features[0];
    if (matchesConstraints(point, workArea)) {
      points.push({
        x: point.geometry.coordinates[0],
        y: point.geometry.coordinates[1]
      });
    }
    if (points.length >= count) {
      break;
    }
  }

  return {
    points
  };
}

function matchesConstraints(point: Feature<Point>, shape: Feature<MultiPolygon | Polygon>): boolean {
  return booleanPointInPolygon(point, shape);
}

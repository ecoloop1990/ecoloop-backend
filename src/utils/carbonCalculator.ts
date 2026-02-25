import carbonFactors from '../data/carbonFactors.json';
import { MaterialType } from '@prisma/client';

const averageWeights: Record<MaterialType, number> = {
    METAL: 0.015,
    PLASTIC: 0.025,
    WOOD: 0.5,
    CARDBOARD: 0.05,
    GLASS: 0.2,
    BIODEGRADABLE: 0.1,
};

export function calculateCarbonImpact(
  materialType: MaterialType,
  quantity: number
) {
  const weight = quantity * averageWeights[materialType];
  const carbonFactor = carbonFactors[materialType];

  const totalCarbonFootprint = weight * carbonFactor;

  return {
    totalWeight: weight,
    totalCarbonFootprint,
  };
}
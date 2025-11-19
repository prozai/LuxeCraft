import { MetalType, GemType, ProductType, ProngType, GemCut } from './types';

export const SHAPE_COST = 50;

export const PRICES = {
  BASE_LABOR: 150,
  METALS: {
    [MetalType.Gold]: 800,
    [MetalType.RoseGold]: 850,
    [MetalType.Silver]: 100,
    [MetalType.Platinum]: 1200,
    [MetalType.BlackTitanium]: 400,
  },
  GEMS: {
    [GemType.Diamond]: 2000,
    [GemType.Ruby]: 1200,
    [GemType.Sapphire]: 1100,
    [GemType.Emerald]: 1400,
    [GemType.Amethyst]: 300,
    [GemType.None]: 0,
  },
  GEM_CUT_MULTIPLIERS: {
    [GemCut.Round]: 1.0,
    [GemCut.Princess]: 1.1, // More complex to set
    [GemCut.Emerald]: 1.15,
    [GemCut.Oval]: 1.05,
    [GemCut.Pear]: 1.2,
  },
  PRONGS: {
    [ProngType.Prong4]: 150,
    [ProngType.Prong6]: 200,
    [ProngType.Bezel]: 350,
  },
  PRODUCT_MULTIPLIER: {
    [ProductType.Ring]: 1,
    [ProductType.Bangle]: 1.8, // More metal
    [ProductType.Pendant]: 0.7,
  }
};

export const METAL_COLORS = {
  [MetalType.Gold]: '#FFD700',
  [MetalType.RoseGold]: '#B76E79',
  [MetalType.Silver]: '#C0C0C0',
  [MetalType.Platinum]: '#E5E4E2',
  [MetalType.BlackTitanium]: '#1a1a1a',
};

export const GEM_COLORS = {
  [GemType.Diamond]: '#ffffff',
  [GemType.Ruby]: '#e0115f',
  [GemType.Sapphire]: '#0f52ba',
  [GemType.Emerald]: '#50c878',
  [GemType.Amethyst]: '#9966cc',
  [GemType.None]: '#000000', // Transparent/Invisible
};

export const INITIAL_STATE = {
  productType: ProductType.Ring,
  metal: MetalType.Gold,
  gem: GemType.Diamond,
  gemCut: GemCut.Round,
  gemSize: 1,
  bandWidth: 1,
  prong: ProngType.Prong4,
  engraving: '',
  gemPosition: null,
  gemNormal: null,
  gemRotation: [0, 0, 0] as [number, number, number],
  customShapes: [],
};
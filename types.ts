export enum MetalType {
  Gold = 'Gold',
  RoseGold = 'Rose Gold',
  Silver = 'Silver',
  Platinum = 'Platinum',
  BlackTitanium = 'Black Titanium'
}

export enum GemType {
  Diamond = 'Diamond',
  Ruby = 'Ruby',
  Sapphire = 'Sapphire',
  Emerald = 'Emerald',
  Amethyst = 'Amethyst',
  None = 'None'
}

export enum GemCut {
  Round = 'Round',
  Princess = 'Princess',
  Emerald = 'Emerald',
  Oval = 'Oval',
  Pear = 'Pear'
}

export enum ProductType {
  Ring = 'Ring',
  Bangle = 'Bangle',
  Pendant = 'Pendant'
}

export enum ProngType {
  Prong4 = '4 Prongs',
  Prong6 = '6 Prongs',
  Bezel = 'Bezel Setting'
}

export enum ShapeType {
  Sphere = 'Sphere',
  Cube = 'Cube',
  Pyramid = 'Pyramid',
  Torus = 'Torus'
}

export interface CustomShape {
  id: string;
  type: ShapeType;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface DesignState {
  productType: ProductType;
  metal: MetalType;
  gem: GemType;
  gemCut: GemCut;
  gemSize: number; // 0.5 to 3.0 carats approx scale
  bandWidth: number; // 1 to 5 scale
  prong: ProngType;
  engraving: string;
  gemPosition?: [number, number, number] | null;
  gemNormal?: [number, number, number] | null;
  gemRotation?: [number, number, number] | null;
  customShapes: CustomShape[];
}

export interface PriceBreakdown {
  base: number;
  metalCost: number;
  gemCost: number;
  prongCost: number;
  labor: number;
  total: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isSystem?: boolean;
}

export interface ContextMenuData {
  x: number;
  y: number;
  meshId: string;
  faceIndex: number | undefined;
}

export interface MeshModification {
  type: 'extrude' | 'intrude' | 'delete';
  meshId: string;
  faceIndex: number;
  timestamp: number; // Used to trigger effect hooks
}
export type PartCategory = 'lipid' | 'protein' | 'carbohydrate' | 'fluid' | 'cytoskeleton' | 'organelle' | 'genetic' | 'envelope';

export interface DiagramPart {
  id: string;
  nameAr: string;
  nameEn: string;
  category: PartCategory;
  color: string;
  summary: string;
  functionAr: string;
  compositionAr: string;
  permeabilityAr: string;
  examNoteAr: string;
  // Visual pointer label coordinates on SVG viewBox (1000 x 600)
  pointer: {
    targetX: number;
    targetY: number;
    labelX: number;
    labelY: number;
    anchor?: 'start' | 'middle' | 'end';
  };
}

export type ScientificDiagramType = 
  | 'bacteria' 
  | 'lysosome' 
  | 'mitochondria' 
  | 'chloroplast' 
  | 'plasma-membrane'
  | 'chromosome'
  | 'plant-animal-cell'
  | 'active-transport'
  | 'phagocytosis'
  | 'pinocytosis'
  | 'exocytosis'
  | 'osmosis-cells'
  | 'diffusion-exp'
  | 'osmosis-exp'
  | 'glycolysis'
  | 'krebs-cycle'
  | 'mitosis'
  | 'meiosis';

export type TransportType = 'idle' | 'simple-diffusion' | 'facilitated-diffusion' | 'active-transport';

export interface Particle {
  id: number;
  type: 'oxygen' | 'glucose' | 'sodium' | 'water';
  x: number;
  y: number;
  targetY: number;
  speed: number;
  delay: number;
  label: string;
  color: string;
}

export interface QuizQuestion {
  id: number;
  prompt: string;
  targetPartId: string;
  hint: string;
  explanation: string;
}

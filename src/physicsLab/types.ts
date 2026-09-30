export interface DiagramPart {
  id: string;
  name: string;
  englishName?: string;
  pointer: {
    originX: number;
    originY: number;
    elbowX?: number;
    elbowY?: number;
    labelX: number;
    labelY: number;
    align?: 'start' | 'middle' | 'end';
  };
  explanation: string;
  functionText: string;
  locationText?: string;
  color?: string;
  highlightPathId?: string;
}

export interface DiagramConfig {
  id: string;
  numberTag: string;
  title: string;
  subtitle: string;
  curriculumCategory: string;
  viewBox: string;
  parts: DiagramPart[];
}

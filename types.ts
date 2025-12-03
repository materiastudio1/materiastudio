export enum FrameType {
  SVG = 'SVG',
  PNG = 'PNG',
  NONE = 'NONE'
}

export interface Frame {
  id: string;
  type: FrameType;
  content: string; // SVG string or Base64/URL for PNG
  name: string;
}

export enum AppMode {
  CAMERA = 'CAMERA',
  PREVIEW = 'PREVIEW',
  EDITING = 'EDITING' // For generating new frames
}
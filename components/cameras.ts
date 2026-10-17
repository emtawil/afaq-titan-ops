export type Cam = { id: string; label: string; src: string; kind: 'front' | 'rear' | 'side' | 'cabin' | 'body' };
export const CAR_CAMS: Cam[] = [
  { id: 'front', label: 'أمامية', src: './feeds/front.mp4', kind: 'front' },
  { id: 'front-zoom', label: 'أمامية تقريب', src: './feeds/front-zoom.mp4', kind: 'front' },
  { id: 'rear', label: 'خلفية', src: './feeds/rear.mp4', kind: 'rear' },
  { id: 'side-right', label: 'جانبية يمين', src: './feeds/side-right.mp4', kind: 'side' },
  { id: 'side-left', label: 'جانبية يسار', src: './feeds/side-left.mp4', kind: 'side' },
  { id: 'cabin', label: 'داخلية', src: './feeds/cabin.mp4', kind: 'cabin' },
];
export const BODY_CAM: Cam = { id: 'body', label: 'كاميرا الصدر', src: './feeds/body.mp4', kind: 'body' };

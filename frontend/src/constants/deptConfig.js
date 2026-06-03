import { PhMathOperations, PhTestTube, PhLeaf, PhAtom, PhCode } from '@phosphor-icons/vue';

export const DEPT_CONFIG = [
  { key: 'ภาควิชาคณิตศาสตร์',                                  short: 'คณิตศาสตร์',                             color: '#ef4444', icon: PhMathOperations },
  { key: 'ภาควิชาเคมี',                                        short: 'เคมี',                                   color: '#a855f7', icon: PhTestTube       },
  { key: 'ภาควิชาชีววิทยา',                                     short: 'ชีววิทยา',                               color: '#10b981', icon: PhLeaf           },
  { key: 'ภาควิชาฟิสิกส์',                                     short: 'ฟิสิกส์',                                color: '#3b82f6', icon: PhAtom           },
  { key: 'ภาควิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ',     short: 'วิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ', color: '#f97316', icon: PhCode           },
];

export const getDept = (deptName) =>
  DEPT_CONFIG.find(d => d.key === deptName) ?? null;

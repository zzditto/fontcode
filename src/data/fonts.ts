export interface FontInfo {
  id: string;
  name: string;
  fontFamily: string;
  designer: string;
  license: string;
  source: 'google' | 'local' | 'system';
}

export const fonts: FontInfo[] = [
  {
    id: 'fira-code',
    name: 'Fira Code',
    fontFamily: '"Fira Code", monospace',
    designer: 'Nikita Prokopov',
    license: 'SIL Open Font License 1.1',
    source: 'google',
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    fontFamily: '"JetBrains Mono", monospace',
    designer: 'JetBrains / Philipp Nurullin',
    license: 'SIL Open Font License 1.1',
    source: 'google',
  },
  {
    id: 'cascadia-code',
    name: 'Cascadia Code',
    fontFamily: '"Cascadia Code", monospace',
    designer: 'Microsoft (Aaron Bell)',
    license: 'SIL Open Font License 1.1',
    source: 'local',
  },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    fontFamily: '"Source Code Pro", monospace',
    designer: 'Adobe (Paul D. Hunt)',
    license: 'SIL Open Font License 1.1',
    source: 'google',
  },
  {
    id: 'ibm-plex-mono',
    name: 'IBM Plex Mono',
    fontFamily: '"IBM Plex Mono", monospace',
    designer: 'IBM / Mike Abbink',
    license: 'SIL Open Font License 1.1',
    source: 'google',
  },
  {
    id: 'hack',
    name: 'Hack',
    fontFamily: '"Hack", monospace',
    designer: 'Chris Simpkins',
    license: 'MIT License',
    source: 'local',
  },
  {
    id: 'inconsolata',
    name: 'Inconsolata',
    fontFamily: '"Inconsolata", monospace',
    designer: 'Raph Levien',
    license: 'SIL Open Font License 1.1',
    source: 'google',
  },
  {
    id: 'consolas',
    name: 'Consolas',
    fontFamily: 'Consolas, "Liberation Mono", "Courier New", monospace',
    designer: 'Microsoft (Lucas de Groot)',
    license: 'Proprietary（随 Windows/macOS 捆绑）',
    source: 'system',
  },
];

export function getFontByName(name: string): FontInfo | undefined {
  return fonts.find((f) => f.name === name);
}

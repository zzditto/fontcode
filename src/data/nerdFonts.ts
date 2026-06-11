export interface NerdFontVariant {
  id: string;
  label: string;
  fontFamily: string;
  url: string;
  format: 'ttf' | 'otf';
  recommended?: boolean;
}

export interface NerdFontMeta {
  id: string;
  name: string;
  description: string;
  variants: NerdFontVariant[];
}

export const rawBase = 'https://raw.githubusercontent.com/ryanoasis/nerd-fonts/master/patched-fonts';

export const nerdFonts: NerdFontMeta[] = [
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    description: 'JetBrains 出品的现代编程字体，具有清晰字形和良好可读性。',
    variants: [
      {
        id: 'jetbrains-mono-nerd-font-mono-regular',
        label: 'Mono Regular',
        fontFamily: '"JetBrainsMono Nerd Font Mono", monospace',
        url: `${rawBase}/JetBrainsMono/Ligatures/Regular/JetBrainsMonoNerdFontMono-Regular.ttf`,
        format: 'ttf',
        recommended: true,
      },
    ],
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    description: '基于 Fira Mono 的编程字体，支持常用代码连字。',
    variants: [
      {
        id: 'fira-code-nerd-font-mono-regular',
        label: 'Mono Regular',
        fontFamily: '"FiraCode Nerd Font Mono", monospace',
        url: `${rawBase}/FiraCode/Regular/FiraCodeNerdFontMono-Regular.ttf`,
        format: 'ttf',
        recommended: true,
      },
    ],
  },
  {
    id: 'hack',
    name: 'Hack',
    description: '专为源码阅读设计的开源等宽字体，字形宽松清晰。',
    variants: [
      {
        id: 'hack-nerd-font-mono-regular',
        label: 'Mono Regular',
        fontFamily: '"Hack Nerd Font Mono", monospace',
        url: `${rawBase}/Hack/Regular/HackNerdFontMono-Regular.ttf`,
        format: 'ttf',
        recommended: true,
      },
    ],
  },
  {
    id: 'caskaydia-cove',
    name: 'Caskaydia Cove',
    description: 'Cascadia Code 的 Nerd Fonts 衍生版本，适合终端和编辑器。',
    variants: [
      {
        id: 'caskaydia-cove-nerd-font-mono-regular',
        label: 'Mono Regular',
        fontFamily: '"CaskaydiaCove Nerd Font Mono", monospace',
        url: `${rawBase}/CascadiaCode/CaskaydiaCoveNerdFontMono-Regular.ttf`,
        format: 'ttf',
        recommended: true,
      },
    ],
  },
  {
    id: 'inconsolata',
    name: 'Inconsolata',
    description: '经典开源等宽编程字体，字形紧凑清晰，适合代码阅读。',
    variants: [
      {
        id: 'inconsolata-nerd-font-mono-regular',
        label: 'Mono Regular',
        fontFamily: '"Inconsolata Nerd Font Mono", monospace',
        url: `${rawBase}/Inconsolata/InconsolataNerdFontMono-Regular.ttf`,
        format: 'ttf',
        recommended: true,
      },
    ],
  },
  {
    id: 'iosevka',
    name: 'Iosevka',
    description: '窄宽度高信息密度编程字体，适合显示大量代码。',
    variants: [
      {
        id: 'iosevka-nerd-font-mono-regular',
        label: 'Mono Regular',
        fontFamily: '"Iosevka Nerd Font Mono", monospace',
        url: `${rawBase}/Iosevka/IosevkaNerdFontMono-Regular.ttf`,
        format: 'ttf',
        recommended: true,
      },
    ],
  },
  {
    id: 'sauce-code-pro',
    name: 'Sauce Code Pro',
    description: 'Source Code Pro 的 Nerd Fonts 衍生版本，字形稳重易读。',
    variants: [
      {
        id: 'sauce-code-pro-nerd-font-mono-regular',
        label: 'Mono Regular',
        fontFamily: '"SauceCodePro Nerd Font Mono", monospace',
        url: `${rawBase}/SourceCodePro/SauceCodeProNerdFontMono-Regular.ttf`,
        format: 'ttf',
        recommended: true,
      },
    ],
  },
  {
    id: 'ubuntu-mono',
    name: 'Ubuntu Mono',
    description: 'Ubuntu 字体家族的等宽字体，风格圆润、辨识度高。',
    variants: [
      {
        id: 'ubuntu-mono-nerd-font-mono-regular',
        label: 'Mono Regular',
        fontFamily: '"UbuntuMono Nerd Font Mono", monospace',
        url: `${rawBase}/UbuntuMono/Regular/UbuntuMonoNerdFontMono-Regular.ttf`,
        format: 'ttf',
        recommended: true,
      },
    ],
  },
  {
    id: 'victor-mono',
    name: 'Victor Mono',
    description: '带有独特斜体风格的编程字体，适合强调代码层次。',
    variants: [
      {
        id: 'victor-mono-nerd-font-mono-regular',
        label: 'Mono Regular',
        fontFamily: '"VictorMono Nerd Font Mono", monospace',
        url: `${rawBase}/VictorMono/Regular/VictorMonoNerdFontMono-Regular.ttf`,
        format: 'ttf',
        recommended: true,
      },
    ],
  },
  {
    id: 'mononoki',
    name: 'Mononoki',
    description: '为代码显示优化的圆润等宽字体，字符区分度良好。',
    variants: [
      {
        id: 'mononoki-nerd-font-mono-regular',
        label: 'Mono Regular',
        fontFamily: '"Mononoki Nerd Font Mono", monospace',
        url: `${rawBase}/Mononoki/Regular/MononokiNerdFontMono-Regular.ttf`,
        format: 'ttf',
        recommended: true,
      },
    ],
  },
];

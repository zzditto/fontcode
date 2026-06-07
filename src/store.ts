import { reactive, type InjectionKey } from 'vue';
import type { CustomFont } from './services/customFonts';

export interface AppState {
  selectedFont: string;
  fontSize: number;
  theme: 'dark' | 'light';
  activeSnippet: string;
  customFonts: CustomFont[];
}

export const storeKey: InjectionKey<AppState> = Symbol('store');

export const store = reactive<AppState>({
  selectedFont: 'Fira Code',
  fontSize: 14,
  theme: 'dark',
  activeSnippet: 'javascript',
  customFonts: [],
});

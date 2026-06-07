import { reactive, type InjectionKey } from 'vue';

export interface AppState {
  selectedFont: string;
  fontSize: number;
  theme: 'dark' | 'light';
  activeSnippet: string;
}

export const storeKey: InjectionKey<AppState> = Symbol('store');

export const store = reactive<AppState>({
  selectedFont: 'Fira Code',
  fontSize: 14,
  theme: 'dark',
  activeSnippet: 'javascript',
});

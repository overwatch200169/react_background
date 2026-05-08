declare module 'cherry-markdown' {
  export default class Cherry {
    constructor(options: {
      el: HTMLElement;
      value?: string;
      editor?: {
        defaultModel?: string;
        height?: string;
      };
      locale?: string;
      callback?: {
        afterChange?: (text: string, html: string) => void;
        afterInit?: (text: string, html: string) => void;
      };
      toolbars?: {
        toolbar?: (string | string[])[];
        toolbarRight?: string[];
      };
    });
    destroy(): void;
    setValue(value: string): void;
    getValue(): string;
    getHtml(): string;
  }
}

declare module 'cherry-markdown/dist/cherry-markdown.css';

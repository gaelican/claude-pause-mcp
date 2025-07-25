declare module '@shoelace-style/shoelace/dist/utilities/base-path' {
  export function setBasePath(path: string): void;
}

declare namespace JSX {
  interface IntrinsicElements {
    'sl-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      variant?: 'default' | 'primary' | 'success' | 'neutral' | 'warning' | 'danger' | 'text';
      size?: 'small' | 'medium' | 'large';
      disabled?: boolean;
      loading?: boolean;
      pill?: boolean;
      circle?: boolean;
      type?: 'button' | 'submit' | 'reset';
      name?: string;
      value?: string;
      href?: string;
      target?: string;
      download?: string | boolean;
    }, HTMLElement>;
    
    'sl-button-group': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      label?: string;
    }, HTMLElement>;
    
    'sl-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      name?: string;
      src?: string;
      library?: string;
      label?: string;
    }, HTMLElement>;
    
    'sl-badge': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      variant?: 'primary' | 'success' | 'neutral' | 'warning' | 'danger';
      pill?: boolean;
      pulse?: boolean;
    }, HTMLElement>;
    
    'sl-card': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    
    'sl-details': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      summary?: string;
      disabled?: boolean;
      open?: boolean;
    }, HTMLElement>;
    
    'sl-textarea': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      name?: string;
      value?: string;
      label?: string;
      placeholder?: string;
      rows?: number;
      resize?: 'none' | 'vertical' | 'horizontal' | 'auto';
      disabled?: boolean;
      readonly?: boolean;
      minlength?: number;
      maxlength?: number;
      required?: boolean;
      invalid?: boolean;
      autocapitalize?: string;
      autocorrect?: string;
      autocomplete?: string;
      autofocus?: boolean;
      spellcheck?: boolean;
      inputmode?: string;
    }, HTMLElement>;
  }
}
import '@mui/material/styles';

// Define the shape of your custom palette
interface ResourceButtonPalette {
  light: {
    main: string;
    hoverBackground: string;
    hoverText: string;
    active: string;
    text: string;
    border: string;
    selectedBackground: string;
    selectedText: string;
  };
  dark: {
    main: string;
    hoverBackground: string;
    hoverText: string;
    active: string;
    text: string;
    border: string;
    selectedBackground: string;
    selectedText: string;
  };
}

declare module '@mui/material/styles' {
  interface Palette {
    resourceButton: ResourceButtonPalette;
  }
  interface PaletteOptions {
    resourceButton?: ResourceButtonPalette;
  }
}

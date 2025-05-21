// https://colorffy.com/dark-theme-generator?colors=30ca1c-121212
export const themeColor = {
  brand: "#AA60C8",
  text: {
    1: { dark: "#ffffff", light: "#121212" },
    2: { dark: "#f0f0f0", light: "#282828" },
    3: { dark: "#e1e1e1", light: "#3f3f3f" },
  },
  surface: {
    1: { dark: "#121212", light: "#ffffff" },
    2: { dark: "#282828", light: "#f0f0f0" },
    3: { dark: "#3f3f3f", light: "#e1e1e1" },
    4: { dark: "#575757", light: "#d3d3d3" },
  },
  primary: {
    foreground: { dark: "#a665c0", light: "#a665c0" },
    background: { dark: "#c895db", light: "#9e6db0" },
  },
  secondary: {
    foreground: { dark: "#2d2132", light: "#efdff4" },
    background: { dark: "#6c6370", light: "#c9becc" },
  },
  infos: { dark: "#2596be", light: "#2596be;" },
  succes: { dark: "#30ca1c", light: "#30ca1c" },
  warning: { dark: "#FF8400", light: "#FF8400" },
  failure: { dark: "#CD1818", light: "#CD1818" },
};

export default (theme: "dark" | "light") => {
  return {
    brand: themeColor.brand,
    text: {
      1: themeColor.text[1][theme],
      2: themeColor.text[2][theme],
      3: themeColor.text[3][theme],
    },
    surface: {
      1: themeColor.surface[1][theme],
      2: themeColor.surface[2][theme],
      3: themeColor.surface[3][theme],
      4: themeColor.surface[4][theme],
    },
    primary: {
      foreground: themeColor.primary.foreground[theme],
      background: themeColor.primary.background[theme],
    },
    secondary: {
      foreground: themeColor.secondary.foreground[theme],
      background: themeColor.secondary.background[theme],
    },
  };
};

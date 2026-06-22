import { StyleSheet } from 'react-native';

export const C = {
  bg: '#1A1A1A',
  bg2: '#2D2D2D',
  bg3: '#404040',
  white: '#FFFFFF',
  yellow: '#F1C40F',
  green: '#2ECC71',
  red: '#E74C3C',
  blue: '#3498DB',
  orange: '#F39C12',
  black: '#000000',
  paper: '#FFFFFF',
  paperInk: '#1A1A1A',
  skySoft: '#0F3460',
};

export const FONT = {
  display: 'Silkscreen',
  displayBold: 'SilkscreenBold',
  body: 'VT323',
};

// Hard "pixel" shadow used for chunky 8-bit pop
export const pixelShadow = (offset = 4, color = '#000') => ({
  shadowColor: color,
  shadowOffset: { width: offset, height: offset },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 0,
});

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  pixelBorder: {
    borderWidth: 4,
    borderColor: C.black,
  },
  displayText: {
    fontFamily: FONT.display,
    color: C.white,
  },
  bodyText: {
    fontFamily: FONT.body,
    color: C.white,
  },
});

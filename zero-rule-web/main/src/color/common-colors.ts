import {
  red,
  pink,
  purple,
  deepPurple,
  indigo,
  blue,
  lightBlue,
  cyan,
  teal,
  green,
  lightGreen,
  lime,
  yellow,
  amber,
  orange,
  deepOrange,
  brown,
} from '@mui/material/colors';
import { string } from 'yup';

const pickPrimary = (colorSeries: any): string => {
  return colorSeries[500] as string;
};

const pickAccent = (colorSeries: any): string => {
  return colorSeries[200] as string;
};

export const primaryColors = [
  pickPrimary(red),
  pickPrimary(pink),
  pickPrimary(purple),
  pickPrimary(deepPurple),
  pickPrimary(indigo),
  pickPrimary(blue),
  pickPrimary(lightBlue),
  pickPrimary(cyan),
  pickPrimary(teal),
  pickPrimary(green),
  pickPrimary(lightGreen),
  pickPrimary(lime),
  pickPrimary(yellow),
  pickPrimary(amber),
  pickPrimary(orange),
  pickPrimary(deepOrange),
  pickPrimary(brown),
];

export const accentColors = [
  pickAccent(red),
  pickAccent(pink),
  pickAccent(purple),
  pickAccent(deepPurple),
  pickAccent(indigo),
  pickAccent(blue),
  pickAccent(lightBlue),
  pickAccent(cyan),
  pickAccent(teal),
  pickAccent(green),
  pickAccent(lightGreen),
  pickAccent(lime),
  pickAccent(yellow),
  pickAccent(amber),
  pickAccent(orange),
  pickAccent(deepOrange),
  pickAccent(brown),
];

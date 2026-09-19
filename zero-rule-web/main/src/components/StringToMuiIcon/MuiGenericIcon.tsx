import * as icons from '@mui/icons-material';

export type IconNames = keyof typeof icons;

interface IGenericIconProps {
  iconName: IconNames;
}
export const MuiGenericIcon = ({ iconName }: IGenericIconProps): JSX.Element => {
  const Icon = icons[iconName];
  return <Icon />;
};

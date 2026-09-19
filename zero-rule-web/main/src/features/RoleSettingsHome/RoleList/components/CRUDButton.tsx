import { alpha, ToggleButton, ToggleButtonGroup } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
type Props = {
  values: Array<'C' | 'R' | 'U' | 'D'>;
  onChange: (values: Array<'C' | 'R' | 'U' | 'D'>) => void;
};

export default function CRUDButton(props: Props) {
  const { values, onChange } = props;

  const handleChange = (event: React.MouseEvent<HTMLElement>, newValues: string[]) => {
    onChange(newValues as Array<'C' | 'R' | 'U' | 'D'>);
  };

  return (
    <ToggleButtonGroup
      color="primary"
      value={values}
      onChange={handleChange}
      aria-label="CRUD"
      sx={{
        '& .Mui-selected': {
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.15),
          '& .MuiSvgIcon-root': {
            display: 'block',
            position: 'absolute',
            width: 10,
            top: -5,
            // bottom: -5,
            left: 3,
          },
        },
        '& .MuiSvgIcon-root': { display: 'none' },
      }}
    >
      <ToggleButton value="C" size="small" sx={{ px: 2 }}>
        <CheckIcon />C
      </ToggleButton>
      <ToggleButton value="R" size="small" sx={{ px: 2 }}>
        <CheckIcon /> R
      </ToggleButton>
      <ToggleButton value="U" size="small" sx={{ px: 2 }}>
        <CheckIcon /> U
      </ToggleButton>
      <ToggleButton value="D" size="small" sx={{ px: 2 }}>
        <CheckIcon /> D
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

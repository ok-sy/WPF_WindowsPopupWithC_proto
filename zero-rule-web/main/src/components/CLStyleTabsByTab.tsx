import { flatSx } from '@local/ui';
import type { TabProps, TabsProps } from '@mui/material';
import { Tab, Tabs } from '@mui/material';
import { styled } from '@mui/material/styles';

export type TabLabelValues = {
  tabLabel?: string;
  tabValue?: string;
};

type Props = {
  tabLabelValues: TabLabelValues[];
  size?: 'small' | 'medium' | 'large';
} & TabsProps;

export default function CLStyleTabsByTab(props: Props) {
  const { tabLabelValues, sx, size = 'large', ...rest } = props;
  const height = props.size === 'small' ? 30 : props.size === 'medium' ? 35 : 42;
  const fontSize =
    props.size === 'small' ? '0.75rem' : props.size === 'medium' ? '0.85rem' : '0.9rem';

  return (
    <StyledTabs
      sx={flatSx(sx, { minHeight: height, maxHeight: height, fontSize: fontSize })}
      {...rest}
      className="CLStyleTabsByTab-root"
    >
      {tabLabelValues.map(({ tabLabel, tabValue }) => (
        <StyledTab
          sx={{ minHeight: height, maxHeight: height, fontSize: fontSize }}
          key={tabValue}
          label={tabLabel}
          value={tabValue}
        />
      ))}
    </StyledTabs>
  );
}

const StyledTab = styled(Tab)<TabProps>(({ theme }) => {
  return {
    marginRight: theme.spacing(0.5),
    fontSize: '0.9rem',
    border: '1px solid #e0e4ee',
    backgroundColor: '#e1e1e180',
    minHeight: 42,
    maxHeight: 42,
    '&.Mui-selected': {
      color: theme.palette.primary.dark,
      backgroundColor: '#fff',
    },
  };
});

const StyledTabs = styled(Tabs)<TabsProps>(({ theme }) => {
  return {
    minHeight: 42,
    maxHeight: 42,
    '& .MuiTabs-indicator': {
      backgroundColor: theme.palette.primary.main,
    },
    // '& .MuiTabs-indicator': { border: '1px solid #fafafe' },
  };
});

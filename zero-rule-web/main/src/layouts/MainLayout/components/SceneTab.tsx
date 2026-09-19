import type { IScene } from '@/scene/types';
import CloseIcon from '@mui/icons-material/Close';
import type { TabProps } from '@mui/material';
import { IconButton, styled, Tab as MuiTab, Tooltip, Typography } from '@mui/material';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const classes = {
  title: 'SceneTab-title',
  activeIndicator: 'SceneTab-activeIndicator',
  closeButton: 'SceneTab-closeButton',
};

type Props = {
  scene: IScene;
  selected: boolean;
  onClickDeleteBtn?: React.MouseEventHandler;
} & TabProps;

export default function SceneTab(props: Props) {
  const { scene, onClickDeleteBtn, className, selected, label, disableRipple, ...rest } = props;
  const { title, url } = scene;

  const handleClickDeleteBtn = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClickDeleteBtn?.(event);
  };

  return (
    <Tooltip title={url}>
      <StyledTab
        sx={{
          minHeight: 35,
          maxHeight: 35,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          borderLeft: '1px solid #e0e4ee',
          borderTop: '1px solid #e0e4ee',
          borderRight: '1px solid #e0e4ee',
          borderBottom: 'none',
        }}
        className={clsx('SceneTab-root', className, {
          'Mui-selected': selected,
        })}
        disableRipple
        label={
          <>
            <Typography variant="body1" component="div" className={classes.title}>
              {title}
            </Typography>
            <IconButton
              size="small"
              onClick={handleClickDeleteBtn}
              component="div"
              className={classes.closeButton}
            >
              <CloseIcon sx={{ fontSize: '0.8rem', color: '#222' }} />
            </IconButton>
          </>
        }
        {...rest}
      />
    </Tooltip>
  );
}

const StyledTab = styled(MuiTab)(
  ({ theme }) => `
  color: #5f605f;
  background-color: #eeefed;
  padding: 0px 16px 0px 8px;
  margin: 0px 2px 0 0px;
  border: 1px solid rgb(224, 228, 238);
  border-radius: 0;
  overflow: hidden;

&:hover {
  color: ${theme.palette.primary.main}
}

&.Mui-selected {
  background-color: #fafafe;
  color: ${theme.palette.primary.main};
}

& .${classes.closeButton} {
  display: none;
  top: -2px;
  right: -2px;
  width: 24px;
  height: 24px;
  transform: translateY(0%);
  position: absolute;
}

&:hover .${classes.closeButton} {
  display: inline-flex;
}

& .${classes.title} {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}


  `,
);

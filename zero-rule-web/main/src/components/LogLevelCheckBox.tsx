import type { CLLogLevelKey } from '@local/domain';
import { CLLogLevel } from '@local/domain';
import { Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel } from '@mui/material';
import React, { useState } from 'react';

type Props = {
  initialChecked?: CLLogLevelKey[];
  onChange: (logLevels: CLLogLevelKey[]) => void;
};

export default function LogLevelCheckBox(props: Props) {
  const { initialChecked = [], onChange } = props;
  const [checkedLogLevels, setCheckedLogLevels] = useState<CLLogLevelKey[]>(initialChecked);

  const _handleCheckChanges = (logLevel: CLLogLevelKey, checked: boolean) => {
    let newValues: CLLogLevelKey[] = [];
    if (checked) {
      newValues = checkedLogLevels.concat([logLevel]);
    } else {
      newValues = checkedLogLevels.filter((it) => it !== logLevel);
    }
    setCheckedLogLevels(newValues);
    onChange?.(newValues);
  };

  return (
    <FormControl>
      <FormLabel component="legend">로그 LEVEL</FormLabel>
      <FormGroup row>
        {Object.entries(CLLogLevel).map(([logLevel, desc]) => (
          <FormControlLabel
            key={`AppLogLevel-${logLevel}`}
            control={
              <Checkbox
                checked={checkedLogLevels.indexOf(logLevel as CLLogLevelKey) >= 0}
                onChange={(e, checked) => _handleCheckChanges(logLevel as CLLogLevelKey, checked)}
                value={logLevel}
              />
            }
            label={desc}
          />
        ))}
      </FormGroup>
    </FormControl>
  );
}

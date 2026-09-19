import React from 'react';

interface CustomSwitchProps {
  checked: boolean;
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  activeText?: string;
  unActiveText?: string;
  disabled?: boolean; // 새로운 prop 추가
  size?: 'small' | 'medium' | 'large';
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({
  checked = false,
  onClick,
  activeText,
  unActiveText,
  disabled = false, // prop 기본값 설정
  size = 'small',
}) => {
  const width = size === 'small' ? 50 : size === 'medium' ? 63 : 80;
  const mlr = size === 'small' ? 3 : size === 'medium' ? 4 : 4;
  const mlr2 = size === 'small' ? 0 : size === 'medium' ? 1 : 2;
  return (
    <div
      className="custom-switch"
      style={{
        minWidth: width,
        maxWidth: width,
        display: 'flex',
        alignItems: 'center',
        borderRadius: '5px',
        backgroundColor: checked ? '#4CAF50' : '#ccc', // 비활성화 상태일 때 배경색 변경
        padding: '2px',
        cursor: disabled ? 'not-allowed' : 'pointer', // 비활성화 상태일 때 커서 변경
        flexDirection: checked ? 'row-reverse' : 'row',
      }}
      onClick={(e) => {
        if (disabled) return;
        onClick(e);
      }}
    >
      <div
        className="slider"
        style={{
          minWidth: '20px',
          height: '20px',
          backgroundColor: '#fff',
          borderRadius: '5px',
          transform: checked ? 'translateX(3px)' : 'translateX(-3px)',
          transition: 'transform 0.2s ease-in-out',
          marginLeft: checked ? mlr2 : mlr,
          marginRight: checked ? mlr : mlr2,
        }}
      ></div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: checked ? 'flex-start' : 'flex-end',
          whiteSpace: 'nowrap',
          fontSize: '12px',
          marginLeft: checked ? '5px' : '0',
          marginRight: checked ? '0' : '5px',
        }}
      >
        {checked ? activeText : unActiveText}
      </div>
    </div>
  );
};

export default CustomSwitch;

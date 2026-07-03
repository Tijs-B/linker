import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon';

export default function SmartphoneLocationPinIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <g fill="none" stroke="currentColor" strokeWidth="1.91" strokeMiterlimit="10">
        <path d="M14.86,17.51v3.21a1.78,1.78,0,0,1-1.78,1.78H3.28A1.78,1.78,0,0,1,1.5,20.72V3.28A1.78,1.78,0,0,1,3.28,1.5h9.8a1.78,1.78,0,0,1,1.78,1.78V4.7" />
        <line x1="7.23" y1="18.68" x2="9.14" y2="18.68" />
        <path d="M22.5,10.09c0,3.82-5.73,9.55-5.73,9.55s-5.72-5.73-5.72-9.55a5.73,5.73,0,1,1,11.45,0Z" />
        <circle cx="16.77" cy="10.09" r="1.91" />
      </g>
    </SvgIcon>
  );
}

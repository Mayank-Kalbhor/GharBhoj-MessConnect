declare module '@tabler/icons-react-native' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';

  export interface TablerIconsProps extends SvgProps {
    size?: number | string;
    stroke?: string;
    strokeWidth?: number | string;
    color?: string;
  }

  export type Icon = React.FC<TablerIconsProps>;

  export const IconMapPin: Icon;
  export const IconSearch: Icon;
  export const IconBell: Icon;
  export const IconStar: Icon;
  export const IconLeaf: Icon;
  export const IconToolsKitchen2: Icon;
  export const IconSoup: Icon;
  export const IconSun: Icon;
  export const IconMoon: Icon;
  export const IconTruckDelivery: Icon;
  export const IconHome: Icon;
  export const IconCheck: Icon;
  export const IconPlayerPause: Icon;
  export const IconX: Icon;
  export const IconArrowsExchange: Icon;
  export const IconArrowDownLeft: Icon;
  export const IconArrowUpRight: Icon;
  export const IconShieldCheck: Icon;
  export const IconBuildingStore: Icon;
  export const IconAlertTriangle: Icon;
  export const IconUsers: Icon;
  export const IconClipboardList: Icon;
  export const IconCalendar: Icon;
  export const IconLayoutDashboard: Icon;
  export const IconChevronRight: Icon;
  export const IconChevronLeft: Icon;
  export const IconPlus: Icon;
  export const IconMinus: Icon;
  export const IconCreditCard: Icon;
  export const IconWallet: Icon;
  export const IconUser: Icon;
  export const IconClock: Icon;
  export const IconInfoCircle: Icon;

  const icons: Record<string, Icon>;
  export default icons;
}

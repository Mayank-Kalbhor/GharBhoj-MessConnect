import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import * as TablerIcons from '@tabler/icons-react-native';
import { Colors } from '../../constants/theme';

export type IconName =
  | 'IconMapPin'
  | 'IconSearch'
  | 'IconBell'
  | 'IconStar'
  | 'IconLeaf'
  | 'IconToolsKitchen2'
  | 'IconSoup'
  | 'IconSun'
  | 'IconMoon'
  | 'IconTruckDelivery'
  | 'IconHome'
  | 'IconCheck'
  | 'IconPlayerPause'
  | 'IconX'
  | 'IconArrowsExchange'
  | 'IconArrowDownLeft'
  | 'IconArrowUpRight'
  | 'IconShieldCheck'
  | 'IconBuildingStore'
  | 'IconAlertTriangle'
  | 'IconUsers'
  | 'IconClipboardList'
  | 'IconCalendar'
  | 'IconLayoutDashboard'
  | 'IconChevronRight'
  | 'IconChevronLeft'
  | 'IconPlus'
  | 'IconMinus'
  | 'IconCreditCard'
  | 'IconWallet'
  | 'IconUser'
  | 'IconClock'
  | 'IconInfoCircle';

interface TablerIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

export const TablerIcon: React.FC<TablerIconProps> = ({
  name,
  size = 18,
  color = Colors.textPrimary,
  strokeWidth = 1.75,
  style,
}) => {
  const IconComponent = (TablerIcons as any)[name];

  if (!IconComponent) {
    return <View style={[{ width: size, height: size }, style]} />;
  }

  return (
    <View style={style}>
      <IconComponent
        size={size}
        color={color}
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </View>
  );
};

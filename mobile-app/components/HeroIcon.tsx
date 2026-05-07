import * as React from 'react';
import Svg, { Circle, Polygon, Rect, Path, Ellipse, Line } from 'react-native-svg';
import { Image, View } from 'react-native';

interface HeroIconProps {
  heroId: string;
  size?: number;
  grayscale?: boolean;
}

// Map of hero IDs to their high-quality image assets
const heroImages: Record<string, any> = {
  strange: require('../assets/images/hero_strange.png'),
  spidey: require('../assets/images/hero_spidey.png'),
  hulk: require('../assets/images/hero_hulk.png'),
  ironman: require('../assets/images/hero_ironman.png'),
  panther: require('../assets/images/hero_panther.png'),
};

export const HeroIcon = ({ heroId, size = 100, grayscale = false }: HeroIconProps) => {
  // If we have a high-quality image for this hero, use it!
  if (heroImages[heroId]) {
    return (
      <View style={{ 
        width: size, 
        height: size, 
        borderRadius: size / 2, 
        overflow: 'hidden', 
        backgroundColor: grayscale ? '#334155' : '#000',
        opacity: grayscale ? 0.4 : 1
      }}>
        <Image 
          source={heroImages[heroId]} 
          style={{ width: '100%', height: '100%' }} 
          resizeMode="cover"
        />
      </View>
    );
  }

  // Fallback to high-quality SVG designs for the rest
  return (
    <View style={{ opacity: grayscale ? 0.3 : 1 }}>
      {(() => {
        switch (heroId) {
          case 'cap':
            return (
              <Svg viewBox="0 0 100 100" width={size} height={size}>
                <Circle cx="50" cy="50" r="48" fill={grayscale ? "#64748b" : "#E23636"} />
                <Circle cx="50" cy="50" r="37" fill={grayscale ? "#94a3b8" : "#ffffff"} />
                <Circle cx="50" cy="50" r="26" fill={grayscale ? "#64748b" : "#E23636"} />
                <Circle cx="50" cy="50" r="16" fill={grayscale ? "#475569" : "#0051B5"} />
                <Polygon
                  points="50,30 53.8,41.8 66.2,41.8 56.2,49.2 60,61 50,53.6 40,61 43.8,49.2 33.8,41.8 46.2,41.8"
                  fill={grayscale ? "#cbd5e1" : "#ffffff"}
                />
              </Svg>
            );
          case 'thor':
            return (
              <Svg viewBox="0 0 100 100" width={size} height={size}>
                <Circle cx="50" cy="50" r="48" fill={grayscale ? "#334155" : "#334155"} />
                <Rect x="26" y="18" width="48" height="34" rx="4" fill={grayscale ? "#64748b" : "#94a3b8"} />
                <Rect x="28" y="20" width="44" height="6" rx="2" fill={grayscale ? "#94a3b8" : "#cbd5e1"} opacity="0.4" />
                <Line x1="26" y1="34" x2="74" y2="34" stroke={grayscale ? "#475569" : "#64748b"} strokeWidth="1.5" />
                <Line x1="26" y1="40" x2="74" y2="40" stroke={grayscale ? "#475569" : "#64748b"} strokeWidth="1.5" />
                <Rect x="38" y="50" width="24" height="7" rx="2" fill={grayscale ? "#475569" : "#78716c"} />
                <Rect x="46" y="55" width="8" height="30" rx="3" fill={grayscale ? "#475569" : "#92400e"} />
                <Line x1="46" y1="63" x2="54" y2="63" stroke={grayscale ? "#334155" : "#78350f"} strokeWidth="2" />
                <Line x1="46" y1="71" x2="54" y2="71" stroke={grayscale ? "#334155" : "#78350f"} strokeWidth="2" />
                <Line x1="46" y1="79" x2="54" y2="79" stroke={grayscale ? "#334155" : "#78350f"} strokeWidth="2" />
                <Path d="M 26 22 L 12 18 L 14 32 L 26 30 Z" fill={grayscale ? "#475569" : "#64748b"} />
                <Path d="M 74 22 L 88 18 L 86 32 L 74 30 Z" fill={grayscale ? "#475569" : "#64748b"} />
                <Path d="M 53 24 L 48 33 L 52 33 L 47 44" fill="none" stroke={grayscale ? "#94a3b8" : "#facc15"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            );
          case 'widow':
            return (
              <Svg viewBox="0 0 100 100" width={size} height={size}>
                <Circle cx="50" cy="50" r="48" fill={grayscale ? "#1e293b" : "#18181b"} />
                <Line x1="50" y1="10" x2="50" y2="90" stroke={grayscale ? "#334155" : "#27272a"} strokeWidth="1.5" />
                <Line x1="10" y1="50" x2="90" y2="50" stroke={grayscale ? "#334155" : "#27272a"} strokeWidth="1.5" />
                <Line x1="20" y1="20" x2="80" y2="80" stroke={grayscale ? "#334155" : "#27272a"} strokeWidth="1.5" />
                <Line x1="80" y1="20" x2="20" y2="80" stroke={grayscale ? "#334155" : "#27272a"} strokeWidth="1.5" />
                <Circle cx="50" cy="50" r="35" fill="none" stroke={grayscale ? "#334155" : "#27272a"} strokeWidth="1.5" />
                <Circle cx="50" cy="50" r="22" fill="none" stroke={grayscale ? "#334155" : "#27272a"} strokeWidth="1.5" />
                <Circle cx="50" cy="50" r="10" fill="none" stroke={grayscale ? "#334155" : "#27272a"} strokeWidth="1.5" />
                <Path d="M 34 30 L 66 30 L 50 50 Z" fill={grayscale ? "#64748b" : "#ef4444"} />
                <Path d="M 34 70 L 66 70 L 50 50 Z" fill={grayscale ? "#64748b" : "#ef4444"} />
                <Circle cx="50" cy="50" r="4" fill={grayscale ? "#94a3b8" : "#fca5a5"} />
              </Svg>
            );
          default:
            return (
              <Svg viewBox="0 0 100 100" width={size} height={size}>
                <Circle cx="50" cy="50" r="48" fill={grayscale ? "#334155" : "#1e293b"} />
                <Circle cx="50" cy="50" r="20" fill={grayscale ? "#64748b" : "#38bdf8"} />
              </Svg>
            );
        }
      })()}
    </View>
  );
};

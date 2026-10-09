import { useEffect, useId, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import Animated, { cancelAnimation, Easing, useAnimatedProps, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import COLORS from "../../constants/colors";

const AnimatedPath = Animated.createAnimatedComponent(Path);

function waterPath(phase: number, offset: number, amplitude: number, baseline: number) {
  "worklet";
  let path = "M -8 216 L -8 " + baseline;
  for (let x = -8; x <= 216; x += 8) {
    const y = baseline + Math.sin(x / 208 * Math.PI * 2 + phase + offset) * amplitude;
    path += " L " + x + " " + y;
  }
  return path + " L 216 216 Z";
}

export default function ResultScoreWater({ percent, scoreText }: { percent: number; scoreText: string }) {
  const phase = useSharedValue(0);
  const focused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(AppState.currentState === "active");
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clip = `waterClip${id}`;
  const gradient = `waterGradient${id}`;
  const textClip = `waterTextClip${id}`;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => setActive(state === "active"));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (focused && active && !reducedMotion) {
      phase.value = 0;
      phase.value = withRepeat(withTiming(Math.PI * 2, { duration: 5200, easing: Easing.linear }), -1, false);
    }
    return () => cancelAnimation(phase);
  }, [focused, active, reducedMotion, phase]);

  const progress = Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) / 100 : 0;
  // Inner circle spans y=19..189; water height follows the score percentage.
  const baseline = 189 - 170 * progress;
  const amplitude = Math.min(9, 170 * progress, 170 * (1 - progress));
  const back = useAnimatedProps(() => ({ d: waterPath(phase.value, 0, amplitude, baseline) }));
  const middle = useAnimatedProps(() => ({ d: waterPath(-phase.value, 1.8, amplitude * 0.85, baseline) }));
  const front = useAnimatedProps(() => ({ d: waterPath(phase.value, 3.5, amplitude * 0.65, baseline) }));
  const circumference = 2 * Math.PI * 91;

  return (
    <Svg width={208} height={208} viewBox="0 0 208 208" accessible={false}>
      <Defs>
        <ClipPath id={clip}><Circle cx="104" cy="104" r="85" /></ClipPath>
        <ClipPath id={textClip}><AnimatedPath animatedProps={middle} /></ClipPath>
        <LinearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={COLORS.primary} />
          <Stop offset="1" stopColor={COLORS.primaryDark} />
        </LinearGradient>
      </Defs>
      <Circle cx="104" cy="104" r="91" fill={COLORS.surface} stroke={COLORS.border} strokeWidth="10" />
      <G clipPath={`url(#${clip})`}>
        <AnimatedPath animatedProps={back} fill={COLORS.success} opacity="0.22" />
        <AnimatedPath animatedProps={middle} fill={`url(#${gradient})`} />
        <AnimatedPath animatedProps={front} fill={COLORS.primary} opacity="0.32" />
      </G>
      <G clipPath={`url(#${clip})`}>
        <SvgText x="104" y="117" textAnchor="middle" fontSize="38" fontWeight="800" fill={COLORS.text}>{scoreText}</SvgText>
        <SvgText x="104" y="143" textAnchor="middle" fontSize="12" fill={COLORS.textSecondary}>điểm số</SvgText>
        {/* Change only the submerged portion of each glyph to white. */}
        <G clipPath={`url(#${textClip})`}>
          <SvgText x="104" y="117" textAnchor="middle" fontSize="38" fontWeight="800" fill={COLORS.white}>{scoreText}</SvgText>
          <SvgText x="104" y="143" textAnchor="middle" fontSize="12" fill={COLORS.white}>điểm số</SvgText>
        </G>
      </G>
      {percent > 0 && <Circle cx="104" cy="104" r="91" fill="none" stroke={COLORS.primary} strokeWidth="10"
        strokeLinecap="round" strokeDasharray={[circumference, circumference]}
        strokeDashoffset={circumference * (1 - percent / 100)} rotation="-90" origin="104, 104" />}
    </Svg>
  );
}

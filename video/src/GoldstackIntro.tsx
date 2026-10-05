import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  title: string;
  tagline: string;
};

// Palette borrowed from the game's boot screen (index.html)
const SKY = "#CFE9F5";
const GOLD = "#F5B820";
const GOLD_DARK = "#A8760A";
const INK = "#8A5A0A";

export const GoldstackIntro: React.FC<Props> = ({ title, tagline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const coinDrop = spring({ frame, fps, config: { damping: 12 } });
  const coinY = interpolate(coinDrop, [0, 1], [-600, 0]);
  const coinSpin = interpolate(frame, [0, 150], [0, 720]);

  const titleIn = spring({ frame: frame - 20, fps, config: { damping: 200 } });
  const taglineOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [130, 150], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${SKY} 0%, #FFF4D6 100%)`,
        alignItems: "center",
        justifyContent: "center",
        gap: 60,
        opacity: fadeOut,
        fontFamily: '"Lilita One", "Trebuchet MS", sans-serif',
      }}
    >
      <div
        style={{
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: GOLD,
          boxShadow: `inset 0 -30px 0 ${GOLD_DARK}`,
          transform: `translateY(${coinY}px) rotateY(${coinSpin}deg)`,
        }}
      />
      <div
        style={{
          fontSize: 130,
          color: INK,
          transform: `scale(${titleIn})`,
          textAlign: "center",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 52,
          color: "#4A4453",
          opacity: taglineOpacity,
          textAlign: "center",
          maxWidth: 860,
          fontFamily: '"Nunito Sans", sans-serif',
          fontWeight: 800,
        }}
      >
        {tagline}
      </div>
    </AbsoluteFill>
  );
};

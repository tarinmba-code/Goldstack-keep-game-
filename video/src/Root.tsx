import { Composition } from "remotion";
import { GoldstackIntro } from "./GoldstackIntro";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="GoldstackIntro"
      component={GoldstackIntro}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        title: "Goldstack Keep",
        tagline: "Carry the gold. Raise the wall. Defend 50 lands.",
      }}
    />
  );
};

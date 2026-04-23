import billboard from "@/assets/ads/billboard.jpg";
import pavilionPaint from "@/assets/ads/pavilion-paint.jpg";
import ledLine from "@/assets/ads/led-line.jpg";
import roofSign from "@/assets/ads/roof-sign.jpg";
import facadeBanner from "@/assets/ads/facade-banner.jpg";
import windowSticker from "@/assets/ads/window-sticker.jpg";
import pillarWrap from "@/assets/ads/pillar-wrap.jpg";
import wallMural from "@/assets/ads/wall-mural.jpg";
import sidewalkStand from "@/assets/ads/sidewalk-stand.jpg";
import digitalScreen from "@/assets/ads/digital-screen.jpg";
import flagPole from "@/assets/ads/flag-pole.jpg";
import type { AdTypeKey } from "@/lib/adTypes";

const AD_IMAGES: Record<AdTypeKey, string> = {
  billboard,
  pavilion_paint: pavilionPaint,
  led_running_line: ledLine,
  roof_sign: roofSign,
  facade_banner: facadeBanner,
  window_sticker: windowSticker,
  pillar_wrap: pillarWrap,
  wall_mural: wallMural,
  sidewalk_stand: sidewalkStand,
  digital_screen: digitalScreen,
  flag_pole: flagPole,
};

/**
 * Returns a representative photo for the given advertising placement type.
 */
export function getAdTypeImage(type: AdTypeKey | string | null | undefined): string {
  if (!type) return billboard;
  return AD_IMAGES[type as AdTypeKey] || billboard;
}

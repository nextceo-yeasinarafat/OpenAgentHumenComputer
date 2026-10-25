import {
  LOADING_LOGO_URL,
  loadingLogoStyle,
  loadingPageStyle,
} from "./core_loading.ts";



export default function CoreLoading({ leaving }: { leaving: boolean }) {
  return (
    <div
      style={loadingPageStyle(leaving)}
      aria-label="the loading of the computer"
    >
      <img
        style={loadingLogoStyle()}
        src={LOADING_LOGO_URL}
        alt="openhumen-computer"
        draggable={false}
      />
    </div>
  );
}

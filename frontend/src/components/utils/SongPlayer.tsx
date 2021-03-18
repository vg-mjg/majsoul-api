import * as React from "react";
import YouTube from 'react-youtube';

export function SongPlayer(props: { videoId: string; play?: boolean; }): JSX.Element {
	const [player, setPlayer] = React.useState<YT.Player>(null);
	React.useEffect(() => {
		if (player == null || !props.play) {
			return;
		}
		player.playVideo();
		return () => player.stopVideo();
	}, [player, props.play, props.videoId]);
	return <div style={{ display: "none" }}>
		<YouTube
			videoId={props.videoId}
			onReady={(event) => setPlayer(event.target)}
			onStateChange={(event) => event.data === 0 && event.target.playVideo()}
		>
		</YouTube>
	</div>;
}

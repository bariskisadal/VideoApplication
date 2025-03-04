import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet, Text } from "react-native";
import { Video } from "expo-av";
import { useEffect, useState } from "react";
import { useVideoStore } from "@/components/store/videoStore";

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { videos, loadVideos } = useVideoStore();
  const [video, setVideo] = useState(
    () => videos.find((v) => v.id === id) || null
  );

  useEffect(() => {
    if (!video) {
      loadVideos().then(() => {
        const foundVideo = videos.find((v) => v.id === id);
        if (foundVideo) setVideo(foundVideo);
      });
    }
  }, [id, videos, loadVideos]);

  if (!video) return null;

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: video.uri }}
        style={styles.video}
        useNativeControls
      />
      <Text style={styles.videoTitle}>{video.title}</Text>
      <Text style={styles.videoDesc}>{video.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  video: { width: "100%", height: 300 },
  videoTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  videoDesc: { fontSize: 16, color: "gray", marginTop: 5 },
});

import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import { useVideoStore } from "@/components/store/videoStore";
import { useVideoTrimStore } from "@/components/store/videoTrimStore";
import { FFmpegKit } from "ffmpeg-kit-react-native";
import * as FileSystem from "expo-file-system";

export default function HomeScreen() {
  const { videos, deleteVideo, addVideo, loadVideos } = useVideoStore();
  const {
    selectedVideo,
    startTime,
    endTime,
    videoDuration,
    isTrimmed,
    setSelectedVideo,
    setStartTime,
    setEndTime,
    setVideoDuration,
    setIsTrimmed,
    resetTrim,
  } = useVideoTrimStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const router = useRouter();

  const resetForm = () => {
    setSelectedVideo("");
    setTitle("");
    setDescription("");
    resetTrim();
  };

  const handleAddVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const originalUri = result.assets[0].uri;
      setSelectedVideo(originalUri);
      setIsModalVisible(true);
    }
  };

  const handleTrimVideo = async () => {
    if (!selectedVideo) return;
    const trimmedVideoUri = `${FileSystem.cacheDirectory}trimmed_video.mp4`;

    await FFmpegKit.execute(
      `-i ${selectedVideo} -ss ${startTime} -to ${endTime} -c copy ${trimmedVideoUri}`
    )
      .then(async (session) => {
        await session.getReturnCode();
        setSelectedVideo(trimmedVideoUri);
        setIsTrimmed(true);
        Alert.alert("Success", "Video trimmed successfully!");
      })
      .catch(() => {
        Alert.alert("Error", "An error occurred while trimming the video!");
      });
  };

  const handleSaveVideoDetails = async () => {
    if (!title.trim() || !description.trim() || !selectedVideo || !isTrimmed) {
      Alert.alert("Error", "Title, description, and trimming are required!");
      return;
    }

    const newVideo = {
      id: Date.now().toString(),
      uri: selectedVideo,
      title,
      description,
    };

    await addVideo(newVideo);
    setIsModalVisible(false);
    resetForm();
  };

  useEffect(() => {
    loadVideos();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.videoContainer}>
            <TouchableOpacity onPress={() => router.push(`/video/${item.id}`)}>
              <Video
                source={{ uri: item.uri }}
                style={styles.video}
                useNativeControls
              />
              <Text style={styles.videoTitle}>{item.title}</Text>
              <Text style={styles.videoDesc}>{item.description}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteVideo(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noVideosText}>No videos found!</Text>
        }
      />

      <TouchableOpacity style={styles.addButton} onPress={handleAddVideo}>
        <Ionicons name="add-circle-outline" size={40} color="white" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setIsModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Video Details</Text>
          <Video
            source={{ uri: selectedVideo ?? "" }}
            style={{ width: 300, height: 200 }}
            useNativeControls
            onLoad={(e: any) => setVideoDuration(e.durationMillis / 1000)}
          />

          <Text>Start: {startTime}s</Text>
          <Slider
            minimumValue={0}
            maximumValue={videoDuration}
            value={startTime}
            step={1}
            onValueChange={setStartTime}
          />
          <Text>End: {endTime}s</Text>
          <Slider
            minimumValue={startTime}
            maximumValue={videoDuration}
            step={1}
            value={endTime}
            onValueChange={setEndTime}
          />

          <TouchableOpacity style={styles.button} onPress={handleTrimVideo}>
            <Text style={styles.buttonText}>Trim Video</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSaveVideoDetails}
          >
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setIsModalVisible(false);
              resetForm();
            }}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, marginTop: 40, marginBottom: 70 },
  videoContainer: { marginBottom: 10 },
  video: { width: "100%", height: 200 },
  videoTitle: { fontSize: 16, fontWeight: "bold" },
  videoDesc: { fontSize: 14, color: "gray" },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 50,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    width: 250,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  noVideosText: {
    fontSize: 30,
    display: "flex",
    alignItems: "center",
    textAlign: "center",
    justifyContent: "center",
    color: "red",
  },
  buttonText: { color: "white", fontSize: 18 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalTitle: { fontSize: 22, marginBottom: 10 },
});

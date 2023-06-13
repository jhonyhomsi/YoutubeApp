import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, Button, Alert, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Progress from 'react-native-progress';

const App = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [desiredFormat, setDesiredFormat] = useState('');
  const [formats, setFormats] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Create a WebSocket connection to the server
    const ws = new WebSocket('ws://192.168.1.7:3000');

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      // Parse the message data
      const data = JSON.parse(event.data);
      // Update the download progress state
      setDownloadProgress(data.percentage / 100);
    };

    ws.onerror = (error) => {
      console.error(error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      // Close the WebSocket connection when the component unmounts
      ws.close();
    };
  }, []);

  useEffect(() => {
    const getFormats = async () => {
      if (!videoUrl) {
        return;
      }

      try {
        const response = await fetch('http://192.168.1.7:3000/formats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoUrl }),
        });

        if (response.ok) {
          const data = await response.json();
          setFormats(data.formats);
        } else {
          Alert.alert('Error', 'Failed to get the available formats');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to get the available formats');
      }
    };

    getFormats();
  }, [videoUrl]);

  const handleDownload = async () => {
    if (!videoUrl) {
      Alert.alert('Error', 'Please select a video');
      return;
    }

    if (!desiredFormat) {
      Alert.alert(
        'Select Format',
        'Please select a format',
        formats.map((format) => ({
          text: `${format.quality} - ${format.container} - ${format.codecs}`,
          onPress: () => {
            setDesiredFormat(format.qualityLabel);
            setIsDownloading(true);
            downloadVideo(format.qualityLabel);
          },
        }))
      );
      return;
    }

    setIsDownloading(true);
    downloadVideo(desiredFormat);
  };

  const downloadVideo = async (format) => {
    try {
      const response = await fetch('http://192.168.1.7:3000/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl, format }),
      });

      if (response.ok) {
        console.log("connected");
        const data = await response.json();

        const fileUri = data.filePath;
        const fileName = fileUri.split('/').pop();

        const downloadResumable = FileSystem.createDownloadResumable(
          fileUri,
          FileSystem.documentDirectory + fileName,
          {},
          (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            console.log(`Download progress: ${Math.round(progress * 100)}%`);
            setDownloadProgress(progress);
          }
        );

        const { uri } = await downloadResumable.downloadAsync();

        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Success', 'Download is complete');
      } else {
        Alert.alert('Error', 'Failed to download the video');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to download the video');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require("D:\\Users\\USER\\Documents\\GitHub\\YoutubeApp\\assets\\logo.jpg")} />
      <Text style={styles.label1}>YouTube</Text>
      <Text style={styles.label2}>Downloader</Text>
      <Text style={styles.Child}>With This App, You Can Download Every Video From Youtube Just By Using A Link</Text>
      <TextInput
        style={styles.input}
        placeholder="Paste the video URL here"
        value={videoUrl}
        onChangeText={(text) => setVideoUrl(text)}
      />
      <Button title="Download" onPress={handleDownload} />
      {isDownloading && (
        <>
          <Text style={styles.label}>Download Progress:</Text>
          <Progress.Bar progress={downloadProgress} width={200} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 0.80,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  label1: {
    fontSize: 45,
    textDecorationStyle: 'solid',
    marginBottom: 2.5,
  },
  label2: {
    fontSize: 45,
    textDecorationStyle: 'solid',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  Child: {
    marginBottom: 30,
    color: 'gray',
    fontSize: 10,
    paddingBottom: 10,
  },
  logo: {
    marginBottom: 100,
    width: 45,
    height: 45,
    borderRadius: 0,
  }
});

export default App;
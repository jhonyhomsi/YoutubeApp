import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';

const VideoList = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('http://192.168.1.8:3000/data/videos');
      if (response.ok) {
        const videosData = await response.json();
        setVideos(videosData.videos);
      } else {
        console.error('Failed to fetch videos');
      }
    } catch (error) {
      console.error('Failed to fetch videos', error);
    }
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity style={styles.itemContainer} onPress={() => handleVideoPress(item)}>
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        <Text style={styles.title}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  const handleVideoPress = (video) => {
    // Handle the video press event
    console.log('Video pressed:', video);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Video List</Text>
      <FlatList
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  thumbnail: {
    width: 80,
    height: 60,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    flex: 1,
  },
});

export default VideoList;
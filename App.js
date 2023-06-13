import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import DownloadScreen from './components/download';
import VideoScreen from './components/videolist';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Download" component={DownloadScreen} />
        <Stack.Screen name="VideoList" component={VideoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';

import Image from 'image-js';

export default function App() {

  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [error1, setError1] = useState(null);
  const [error2, setError2] = useState(null);

  useEffect(() => {
    getPermissionAsync();
  }, []);

  const getPermissionAsync = async () => {
    if (Constants.platform.ios) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA);
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
  }

  const pickImage = async (setImage) => {
    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.cancelled) {
        setImage(result.uri);
      } else {
        setImage(null);
      }
      console.log(result);
    } catch (E) {
      setImage(null);
      console.log(E);
    }
  }

  const simulationReady = image1 !== null && image2 !== null

  return (
    
    <View style={styles.container}>
      <Text style={{ fontSize: 20 }}>Welcome to TreeGame</Text>
      <Text>Scan tree from each player to start simulation</Text>
      <TouchableOpacity style={image1 === null ? activeButton : readyButton}
        onPress={() => pickImage(setImage1)}>
        <Text style={styles.buttonText}>Scan Player 1</Text>
      </TouchableOpacity>
      {error1 && <Text>{error1}</Text>}
      <TouchableOpacity style={image2 === null ? activeButton : readyButton}
        onPress={() => pickImage(setImage2)}>
        <Text style={styles.buttonText}>Scan Player 2</Text>
      </TouchableOpacity>
      {error2 && <Text>{error2}</Text>}
      <TouchableOpacity style={simulationReady ? readyButton : disabledButton}
        onPress={() => pickImage()} disabled={!simulationReady}>
        <Text style={styles.buttonText}>Start Simulation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    padding: 20,
    borderRadius: 5,
    marginTop: 20
  },
  active: {
    backgroundColor: 'blue'
  },
  ready: {
    backgroundColor: 'green'
  },
  disabled: {
    backgroundColor: 'gray'
  },
  tinyLogo: {
    width: 50,
    height: 50,
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
  }
})

const activeButton = StyleSheet.compose(styles.button, styles.active)
const readyButton = StyleSheet.compose(styles.button, styles.ready)
const disabledButton = StyleSheet.compose(styles.button, styles.disabled)

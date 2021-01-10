import React, {useEffect} from 'react';
import {
  Text,
  StyleSheet,
  View,
  TextInput,
  PermissionsAndroid,
  Image,
  TouchableOpacity,
} from 'react-native';
export default function WelcomeScreen({
  setContainer,
  containers,
  setStreamId,
  streamId,
}) {
  const goCallerOrAnswering = (container) => {
    if (streamId.length > 0) {
      setContainer(container);
    }
  };
  async function requestStoragePermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Galeri kaydetme izni gerekiyor',
          message: 'Fotoğrafınızın galeriye kaydedilmesi için izin veriniz',
          buttonNeutral: 'Daha sonra sor',
          buttonNegative: 'İptal',
          buttonPositive: 'Tamam',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅İzin verildi');
      } else {
        console.log('❌İzin verilmedi');
      }
    } catch (err) {
      console.warn(err);
    }
  }
  async function requestCameraPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Kamera izni gerekiyor',
          message:
            'Kamera ile manzara fotoğrafı çekmek için izin vermeniz gerekiyor.',
          buttonNeutral: 'Daha sonra sor',
          buttonPositive: 'Tamam',
          buttonNegative: 'İptal',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅İzin verildi');
      } else {
        console.log('❌İzin verilmedi');
      }
    } catch (err) {
      console.warn(err);
    }
  }
  async function requestAudioPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Mikrofon izni gerekiyor',
          message:
            'Mikrofon ile ses kaydı yapmak için için izin vermeniz gerekiyor.',
          buttonNeutral: 'Daha sonra sor',
          buttonPositive: 'Tamam',
          buttonNegative: 'İptal',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅İzin verildi');
      } else {
        console.log('❌İzin verilmedi');
      }
    } catch (err) {
      console.warn(err);
    }
  }
  async function requestReadStoragePermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Galeri okuma izni gerekiyor',
          message: 'Galeriden fotograf okumak için',
          buttonNeutral: 'Daha sonra sor',
          buttonNegative: 'İptal',
          buttonPositive: 'Tamam',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅İzin verildi');
      } else {
        console.log('❌İzin verilmedi');
      }
    } catch (err) {
      console.warn(err);
    }
  }

  useEffect(() => {
    async function request() {
      setStreamId('');
      await requestStoragePermission();
      await requestCameraPermission();
      await requestAudioPermission();
      await requestReadStoragePermission();
    }
    request();
  }, []);

  return (
    <>
      <View style={styles.imageView}>
        <Image source={require('../../Assets/logo.png')} style={styles.image} />
      </View>
      <View style={styles.textView}>
        <Text style={styles.text}>Toplantı Adı</Text>
      </View>
      <View style={styles.inputView}>
        <TextInput
          style={styles.input}
          value={streamId}
          onChangeText={setStreamId}
        />
      </View>

      <View style={styles.buttonView}>
        <TouchableOpacity
          style={styles.buttonStyle}
          onPress={() => goCallerOrAnswering(containers.Caller)}>
          <Text style={styles.buttonText}>Toplantı Oluştur</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonView}>
        <TouchableOpacity
          style={styles.buttonStyle}
          onPress={() => goCallerOrAnswering(containers.Answering)}>
          <Text style={styles.buttonText}>Toplantıya Katıl</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.freeView} />
    </>
  );
}

const styles = StyleSheet.create({
  imageView: {
    flex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {width: '80%', height: '25%'},
  textView: {flex: 1},
  text: {
    alignSelf: 'center',
    fontSize: 25,
  },
  inputView: {flex: 1.5, justifyContent: 'center', alignItems: 'center'},
  input: {
    width: '70%',
    height: '60%',
    borderRadius: 30,
    backgroundColor: '#aaa',
    textAlign: 'center',
  },
  buttonView: {
    flex: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonStyle: {
    width: '70%',
    height: '60%',
    borderRadius: 40,
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {fontSize: 17, color: '#fff'},
  freeView: {
    flex: 4.5,
  },
});

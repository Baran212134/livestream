import React, {useState, useEffect, useCallback} from 'react';
import 'react-native-get-random-values';
import {
  Text,
  StyleSheet,
  Button,
  View,
  NativeEventEmitter,
  PermissionsAndroid,
} from 'react-native';
import {v4 as uuidv4} from 'uuid';
import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
import {db} from '../../utilities/firebase';
const eventEmitter = new NativeEventEmitter(RTCView);

const configuration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};
//Burada IP adresinin alınması için Google stun server’ı parametre olarak veriyoruz.
export default function CallerScreen({setContainer, containers, streamId}) {
  function onBackPress() {
    if (cachedLocalPC) {
      cachedLocalPC.removeStream(localStream);
      cachedLocalPC.close();
    }
    setLocalStream();
    setRemoteStream();
    setCachedLocalPC();
    // cleanup
    setContainer(containers.Welcome);
  }

  const [localStream, setLocalStream] = useState(undefined);
  const [remoteStream, setRemoteStream] = useState();
  const [cachedLocalPC, setCachedLocalPC] = useState();
  const [localSnapOption, setLocalSnapOption] = useState(null);
  const [path, setPath] = useState(null);
  const [remoteSnapOption, setRemoteSnapOption] = useState(null);

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    //startLocalStream();
  }, []);

  useEffect(() => {
    //eventEmitter.addListener('WebRTCViewSnapshotResult', webRTCViewSnapshotResult);
    eventEmitter.addListener('WebRTCViewSnapshotResult', (event) => {
      setLocalSnapOption(null);
      console.log('webRTCViewSnapshotResult çalıştııııııııııııııı');
      console.log(event); // "someValue"
      var arr1 = Object.keys(event);
      var arr2 = Object.values(event);
      console.log('arrrrrrrrrrrrrr1'); // "someValue"
      console.log(arr1); // "someValue"
      console.log('arrrrrrrrrrrrrr2'); // "someValue"
      console.log(arr2[0]); // "someValue"
      setPath(arr2[0]);
      /*RNFS.readFile(arr2[0], 'base64').then((res) => {
        console.log('resresres');
        console.log(res);
        console.log('resresres');
      });*/
    });
    return () => {
      eventEmitter.removeAllListeners('WebRTCViewSnapshotResult');
    };
  }, []);

  const onPressTakeSnapshot = async () => {
    let localSnapShotOption = {
      id: uuidv4(), // --- use any value you think it's unique for each screenshot
      saveTarget: 'cameraRoll',
    };
    setLocalSnapOption(localSnapShotOption);
  };

  const startLocalStream = async () => {
    // isFront will determine if the initial camera should face user or environment
    const isFront = true;
    //mediaDevices
    //cihaza bağlı mikrofon ,kamera aygıtları hakkında bilgi döndürür ve kullanıcıdan bu aygıtları kullanabilmek için
    //izin ister.Bu işlem kullanıcıya 1 defa sorulur.daha sonraki çalışmalarda bu seçimler hatırlanır.
    //burada devices aslında cihaz ile ilgili bilgileri içeren bir dizidir. izin verilmesine bakılmaksınız aygıttan bu bilgileri alır.
    const devices = await mediaDevices.enumerateDevices();
    console.log('***********************************');
    console.log(devices);
    //varsayılan olarak açılmak istenen kameranın belirlenmesi için yapılan işlem
    const facing = isFront ? 'front' : 'environment';
    //burada facing değişkeni front olarak güncellenmiştir
    const videoSourceId = devices.find(
      (device) => device.kind === 'videoinput' && device.facing === facing,
    );
    //burada ise devices dizisinde bulunan aygıtlardan aygıt türü videoinput olanı ve ön kamera olan aygıtı diziden
    //bulup o aygıtı videoSourceId ye aktarıyoruz.
    console.log('******************videoSourceId*****************');
    console.log(videoSourceId);
    const facingMode = isFront ? 'user' : 'environment';
    //burada ise facingMode değişkenini isFront=true tanımladığımız için 'user' a eşitlemiş olduk. aynı işlemi facing değişkeni içinde yapmıştık
    const constraints = {
      audio: true,
      video: {
        mandatory: {
          minWidth: 500, // Provide your own width, height and frame rate here
          minHeight: 300,
          minFrameRate: 30,
        },
        facingMode,
        optional: videoSourceId ? [{sourceId: videoSourceId}] : [],
        //burada seçmiş olduğumuz cihazı yani videoSourceId yi sourceId ye veriyoruz
      },
    };
    console.log('******************constraints*****************');
    console.log(constraints.video.optional);

    const newStream = await mediaDevices.getUserMedia(constraints);
    //belirlemiş olduğumuz aygıtlardan (video ve ses) akışı alınır ve bu değişkene atanır.
    setLocalStream(newStream);
    //daha sonra bu değişken state e set edilir.
    console.log(localStream);
  };

  const startCall = async (id) => {
    const localPC = new RTCPeerConnection(configuration);
    //config değişkenini baz alarak bir RTCPeerConnection değişkeni oluşturuyoruz.
    localPC.addStream(localStream);
    console.log('localPC.addStream(localStream) çalıştı +1');
    const roomRef = await db.collection('rooms').doc(id);
    const callerCandidatesCollection = roomRef.collection('callerCandidates');
    localPC.onicecandidate = (e) => {
      console.log('localPC.onicecandidate çalıştı +4');
      if (!e.candidate) {
        console.log('Got final candidate!+5');
        return;
      }
      console.log('call screen ben ice in içindeyim datayı ekliyorum');
      callerCandidatesCollection.add(e.candidate.toJSON());
    };
    //çalışmadı
    localPC.onaddstream = (e) => {
      console.log('localPC.onaddstream çalıştı');
      if (e.stream && remoteStream !== e.stream) {
        console.log('RemotePC received the stream call', e.stream);
        setRemoteStream(e.stream);
        console.log('localPC.onaddstream çalıştı ve setlendi');
      }
    };

    const offer = await localPC.createOffer();
    console.log('localPC.createOffer çalıştı +2');
    await localPC.setLocalDescription(offer);
    console.log('localPC.setLocalDescription(offer) çalıştı +3');
    const roomWithOffer = {offer};
    await roomRef.set(roomWithOffer);
    console.log('roomRef.set(roomWithOffer) çalıştı+6');

    //çalışmadı
    roomRef.onSnapshot(async (snapshot) => {
      const data = snapshot.data();
      if (!localPC.currentRemoteDescription && data.answer) {
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await localPC.setRemoteDescription(rtcSessionDescription);
        console.log('!localPC.currentRemoteDescription && data.answer çalıştı');
      }
    });
    //çalışmadı
    roomRef.collection('calleeCandidates').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          let data = change.doc.data();
          await localPC.addIceCandidate(new RTCIceCandidate(data));
          console.log(
            'localPC.addIceCandidate(new RTCIceCandidate(data)) çalıştı',
          );
        }
      });
    });

    setCachedLocalPC(localPC);
    console.log('setCachedLocalPC(localPC) çalıştı+7');
  };

  const switchCamera = () => {
    localStream.getVideoTracks().forEach((track) => track._switchCamera());
  };

  // Mutes the local's outgoing audio
  const toggleMute = () => {
    if (!remoteStream) {
      return;
    }
    localStream.getAudioTracks().forEach((track) => {
      // console.log(track.enabled ? 'muting' : 'unmuting', ' local track', track);
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    });
  };

  return (
    <>
      <Text style={styles.heading}>Toplantı Adı : {streamId}</Text>

      <View style={styles.callButtons}>
        <View styles={styles.buttonContainer}>
          <Button title="Durdur" onPress={onBackPress} />
        </View>
        <View styles={styles.buttonContainer}>
          {!localStream && (
            <Button title="Akışı Baslat" onPress={startLocalStream} />
          )}
          {localStream && (
            <Button
              title="Toplantıyı Baslat"
              onPress={() => startCall(streamId)}
              disabled={!!remoteStream}
            />
          )}
        </View>
      </View>
      {localStream && (
        <View style={styles.toggleButtons}>
          <Button title="Kamera Degıstır" onPress={switchCamera} />
          <Button title="Snap" onPress={onPressTakeSnapshot} />
          <Button
            title={`${isMuted ? 'Sesi Ac' : 'Sesi Kapat'} `}
            onPress={toggleMute}
            disabled={!remoteStream}
          />
        </View>
      )}
      <View style={{display: 'flex', flex: 1, padding: 10}}>
        <View style={styles.rtcview}>
          {localStream && (
            <RTCView
              style={styles.rtc}
              streamURL={localStream && localStream.toURL()}
              snapshotOption={localStream ? localSnapOption : null}
            />
          )}
          {console.log('******************')}
        </View>
        <View style={styles.rtcview}>
          {remoteStream && (
            <RTCView
              style={styles.rtc}
              streamURL={remoteStream && remoteStream.toURL()}
            />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    alignSelf: 'center',
    fontSize: 30,
  },
  rtcview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    margin: 5,
  },
  rtc: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  toggleButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  callButtons: {
    padding: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  buttonContainer: {
    margin: 5,
  },
});

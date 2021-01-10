import React, {useState, useEffect} from 'react';
import {Text, StyleSheet, Button, View, NativeEventEmitter} from 'react-native';
import 'react-native-get-random-values';
import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
import {db} from '../../utilities/firebase';
import {v4 as uuidv4} from 'uuid';
const eventEmitter = new NativeEventEmitter(RTCView);

const configuration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function AnsweringScreen({setContainer, containers, streamId}) {
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

  const [localStream, setLocalStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [cachedLocalPC, setCachedLocalPC] = useState();
  const [localSnapOption, setLocalSnapOption] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // startLocalStream();
  }, []);

  useEffect(() => {
    //eventEmitter.addListener('WebRTCViewSnapshotResult', webRTCViewSnapshotResult);
    eventEmitter.addListener('WebRTCViewSnapshotResult', (event) => {
      setLocalSnapOption(null);
      console.log('webRTCViewSnapshotResult çalıştııııııııııııııı');
      console.log(event); // "someValue"
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
    const devices = await mediaDevices.enumerateDevices();

    const facing = isFront ? 'front' : 'environment';
    const videoSourceId = devices.find(
      (device) => device.kind === 'videoinput' && device.facing === facing,
    );
    const facingMode = isFront ? 'user' : 'environment';
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
      },
    };
    const newStream = await mediaDevices.getUserMedia(constraints);
    setLocalStream(newStream);
  };

  const joinCall = async (id) => {
    const roomRef = await db.collection('rooms').doc(id);
    const roomSnapshot = await roomRef.get();

    if (!roomSnapshot.exists) {
      return;
    }
    const localPC = new RTCPeerConnection(configuration);
    localPC.addStream(localStream);

    const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
    localPC.onicecandidate = (e) => {
      if (!e.candidate) {
        console.log('join screenGot final candidate!');
        return;
      }
      console.log('join screen ben ice in içindeyim datayı ekliyorum');
      calleeCandidatesCollection.add(e.candidate.toJSON());
    };

    localPC.onaddstream = (e) => {
      if (e.stream && remoteStream !== e.stream) {
        console.log('join screenRemotePC received the stream join', e.stream);
        setRemoteStream(e.stream);
      }
    };

    const offer = roomSnapshot.data().offer;
    await localPC.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await localPC.createAnswer();
    await localPC.setLocalDescription(answer);

    const roomWithAnswer = {answer};
    await roomRef.update(roomWithAnswer);

    roomRef.collection('callerCandidates').onSnapshot((snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          let data = change.doc.data();
          await localPC.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

    setCachedLocalPC(localPC);
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
      <Text style={styles.heading}>Aramaya Katıl</Text>
      <Text style={styles.heading}>Oda : {streamId}</Text>

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
              title="Toplantıya Katıl"
              onPress={() => joinCall(streamId)}
              disabled={!!remoteStream}
            />
          )}
        </View>
      </View>

      {localStream && (
        <View style={styles.toggleButtons}>
          <Button title="Kamera degistir" onPress={switchCamera} />
          <Button title="Snap" onPress={onPressTakeSnapshot} />
          <Button
            title={`${isMuted ? 'Sesi ac' : 'Sesi Kapat'} `}
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

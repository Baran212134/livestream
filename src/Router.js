import React, {useState} from 'react';
import {Text, StyleSheet, SafeAreaView} from 'react-native';
import {CallerScreen, WelcomeScreen, AnsweringScreen} from './Container';
export default function Router() {
  let selectedContainer;
  const containers = {
    Welcome: 'Welcome',
    Caller: 'Caller',
    Answering: 'Answering',
  };
  const [container, setContainer] = useState(containers.Welcome);
  const [streamId, setStreamId] = useState('');
  switch (container) {
    case containers.Welcome:
      selectedContainer = (
        <WelcomeScreen
          streamId={streamId}
          setStreamId={setStreamId}
          containers={containers}
          setContainer={setContainer}
        />
      );
      break;
    case containers.Caller:
      selectedContainer = (
        <CallerScreen
          streamId={streamId}
          containers={containers}
          setContainer={setContainer}
        />
      );
      break;
    case containers.Answering:
      selectedContainer = (
        <AnsweringScreen
          streamId={streamId}
          containers={containers}
          setContainer={setContainer}
        />
      );
      break;
    default:
      selectedContainer = <Text>Error Container not selexcted</Text>;
  }
  return (
    <SafeAreaView style={styles.container}>{selectedContainer}</SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

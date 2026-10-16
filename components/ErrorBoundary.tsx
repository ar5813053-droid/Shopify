import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('UI crash', error);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.box}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.msg}>{this.state.error.message}</Text>
          <Pressable
            style={styles.btn}
            onPress={() => {
              this.setState({ error: null });
              this.props.onReset?.();
            }}
          >
            <Text style={styles.btnText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  msg: { color: '#aaa', textAlign: 'center', marginBottom: 20 },
  btn: {
    backgroundColor: '#5FB437',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  btnText: { color: '#fff', fontWeight: '700' },
});

/**
 * Root error boundary. In release builds an uncaught render error would
 * otherwise leave the root view empty (solid black screen); this surfaces
 * the message so TestFlight builds are debuggable without a crash reporter.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>{this.state.error.message}</Text>
            {__DEV__ && this.state.error.stack ? (
              <Text style={styles.stack}>{this.state.error.stack}</Text>
            ) : null}
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  content: {
    padding: 24,
    paddingTop: 80,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    color: '#ff6b6b',
    fontSize: 15,
    marginBottom: 16,
  },
  stack: {
    color: '#8e8e93',
    fontSize: 12,
    fontFamily: 'Courier',
  },
});

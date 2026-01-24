import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { SvgXml } from 'react-native-svg';

  source: any; // Expo asset module

export const SvgScreen = ({ source, background = '#FFFFFF' }) => {
  const [xml, setXml] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSvg() {
      const asset = Asset.fromModule(source);
      if (!asset.localUri) {
        await asset.downloadAsync();
      }
      const uri = asset.localUri || asset.uri;
      const raw = await FileSystem.readAsStringAsync(uri);
      if (isMounted) {
        setXml(raw);
      }
    }

    loadSvg();

    return () => {
      isMounted = false;
    };
  }, [source]);

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      {xml ? <SvgXml xml={xml} width="100%" height="100%" /> : null}
    </View>
  );

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

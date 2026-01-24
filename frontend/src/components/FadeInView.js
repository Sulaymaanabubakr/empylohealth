import React, { useEffect, useRef, ReactNode } from 'react';
import { Animated } from 'react-native';

  children: ReactNode;

export const FadeInView = ({ children, delay = 0 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(translate, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay, opacity, translate]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: translate }] }}>
      {children}
    </Animated.View>
  );

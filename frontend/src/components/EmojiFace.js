import React from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { COLORS } from '../theme/theme';

    type: 0 | 1 | 2 | 3 | 4 | 5;

const EmojiFace = ({ type, size = 160 }) => {
    // Shared props
    const strokeWidth = size * 0.04; // scale stroke relative to size
    const eyeSize = size * 0.08;

    // Face Colors
    const getFaceColor = () => {
        if (type === 0) return '#BCBCBC'; // Gray for default
        return '#FFD54F'; // Standard detailed yellow
    };

    const faceColor = getFaceColor();

    // Render features based on type
    const renderFeatures = () => {
        switch (type) {
            case 0: // Default - Neutral Gray
                return (
                    <>
                        <Circle cx={size * 0.35} cy={size * 0.45} r={eyeSize} fill="black" />
                        <Circle cx={size * 0.65} cy={size * 0.45} r={eyeSize} fill="black" />
                        <Path
                            d={`M${size * 0.3} ${size * 0.65} L${size * 0.7} ${size * 0.65}`}
                            stroke="black"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                        />
                    </>
                );
            case 1: // Nope - Closed eyes, straight line
                return (
                    <>
                        {/* Closed Eyes (Arcs) */}
                        <Path
                            d={`M${size * 0.25} ${size * 0.45} Q${size * 0.35} ${size * 0.55} ${size * 0.45} ${size * 0.45}`}
                            stroke="black"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            fill="none"
                        />
                        <Path
                            d={`M${size * 0.55} ${size * 0.45} Q${size * 0.65} ${size * 0.55} ${size * 0.75} ${size * 0.45}`}
                            stroke="black"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            fill="none"
                        />
                        {/* Straight Mouth */}
                        <Path
                            d={`M${size * 0.35} ${size * 0.7} L${size * 0.65} ${size * 0.7}`}
                            stroke="black"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                        />
                    </>
                );
            case 2: // Not sure - Worried/Sad
                return (
                    <>
                        {/* Worried Eyes */}
                        <Circle cx={size * 0.35} cy={size * 0.45} r={eyeSize} fill="black" />
                        <Circle cx={size * 0.65} cy={size * 0.45} r={eyeSize} fill="black" />
                        {/* Eyebrows slanted */}
                        <Path d={`M${size * 0.25} ${size * 0.35} L${size * 0.45} ${size * 0.30}`} stroke="black" strokeWidth={strokeWidth * 0.8} strokeLinecap="round" />
                        <Path d={`M${size * 0.55} ${size * 0.30} L${size * 0.75} ${size * 0.35}`} stroke="black" strokeWidth={strokeWidth * 0.8} strokeLinecap="round" />
                        {/* Frown */}
                        <Path
                            d={`M${size * 0.35} ${size * 0.75} Q${size * 0.5} ${size * 0.60} ${size * 0.65} ${size * 0.75}`}
                            stroke="black"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            fill="none"
                        />
                    </>
                );
            case 3: // A little bit - Slight smile
                return (
                    <>
                        <Circle cx={size * 0.35} cy={size * 0.45} r={eyeSize} fill="black" />
                        <Circle cx={size * 0.65} cy={size * 0.45} r={eyeSize} fill="black" />
                        <Path
                            d={`M${size * 0.35} ${size * 0.65} Q${size * 0.5} ${size * 0.75} ${size * 0.65} ${size * 0.65}`}
                            stroke="black"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            fill="none"
                        />
                    </>
                );
            case 4: // Kind of - Wink
                return (
                    <>
                        {/* Left Eye Open */}
                        <Circle cx={size * 0.35} cy={size * 0.45} r={eyeSize} fill="black" />
                        {/* Right Eye Wink */}
                        <Path
                            d={`M${size * 0.55} ${size * 0.45} Q${size * 0.65} ${size * 0.55} ${size * 0.75} ${size * 0.45}`}
                            stroke="black"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            fill="none"
                        />
                        {/* Smile (slightly bigger) */}
                        <Path
                            d={`M${size * 0.3} ${size * 0.65} Q${size * 0.5} ${size * 0.85} ${size * 0.7} ${size * 0.65}`}
                            stroke="black"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            fill="none"
                        />
                    </>
                );
            case 5: // Absolutely - Heart Eyes
                return (
                    <>
                        {/* Heart Eyes */}
                        <Path
                            d={`M${size * 0.25} ${size * 0.45} 
                               C${size * 0.25} ${size * 0.35}, ${size * 0.35} ${size * 0.35}, ${size * 0.35} ${size * 0.45} 
                               C${size * 0.35} ${size * 0.35}, ${size * 0.45} ${size * 0.35}, ${size * 0.45} ${size * 0.45} 
                               Q${size * 0.35} ${size * 0.60} ${size * 0.25} ${size * 0.45} Z`}
                            fill="#FF5252"
                            stroke="black"
                            strokeWidth={strokeWidth * 0.5}
                            transform={`translate(${size * 0.05}, 0)`} // slight adjustment
                        />
                        <Path
                            d={`M${size * 0.55} ${size * 0.45} 
                               C${size * 0.55} ${size * 0.35}, ${size * 0.65} ${size * 0.35}, ${size * 0.65} ${size * 0.45} 
                               C${size * 0.65} ${size * 0.35}, ${size * 0.75} ${size * 0.35}, ${size * 0.75} ${size * 0.45} 
                               Q${size * 0.65} ${size * 0.60} ${size * 0.55} ${size * 0.45} Z`}
                            fill="#FF5252"
                            stroke="black"
                            strokeWidth={strokeWidth * 0.5}
                            transform={`translate(${size * 0.05}, 0)`}
                        />
                        {/* Big Smile */}
                        <Path
                            d={`M${size * 0.3} ${size * 0.65} Q${size * 0.5} ${size * 0.9} ${size * 0.7} ${size * 0.65} Z`}
                            fill="white"
                            stroke="black"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Outline & Face Background */}
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - strokeWidth}
                fill={faceColor}
                stroke="black"
                strokeWidth={strokeWidth}
            />
            {renderFeatures()}
        </Svg>
    );
};

export default EmojiFace;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { RefObject, useEffect, useState, useRef } from 'react';

import { renderBasicFace } from './basic-face-render';

import useFace from '../../../hooks/demo/use-face';
import useHover from '../../../hooks/demo/use-hover';
import useTilt from '../../../hooks/demo/use-tilt';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

// Minimum volume level that indicates audio output is occurring
const AUDIO_OUTPUT_DETECTION_THRESHOLD = 0.05;

// Amount of delay between end of audio output and setting talking state to false
const TALKING_STATE_COOLDOWN_MS = 2000;

type BasicFaceProps = {
  /** The canvas element on which to render the face. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** The radius of the face. */
  radius?: number;
  /** The color of the face. */
  color?: string;
  /** Optional URL for a profile image. */
  imageUrl?: string;
};

export default function BasicFace({
  canvasRef,
  radius = 250,
  color,
  imageUrl,
}: BasicFaceProps) {
  const timeoutRef = useRef<number | null>(null); // Corrected type for timeoutRef

  // Audio output volume
  const { volume } = useLiveAPIContext();

  // Talking state
  const [isTalking, setIsTalking] = useState(false);

  const [scale, setScale] = useState(0.1);

  // Face state
  const { eyeScale, mouthScale } = useFace();
  const hoverPosition = useHover();
  const tiltAngle = useTilt({
    maxAngle: 5,
    speed: 0.075,
    isActive: isTalking,
  });

  useEffect(() => {
    function calculateScale() {
      const newScale = Math.min(window.innerWidth, window.innerHeight) / 1000;
      setScale(Math.max(0.1, newScale)); // Ensure scale is not too small
    }
    window.addEventListener('resize', calculateScale);
    calculateScale();
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  // Detect whether the agent is talking based on audio output volume
  // Set talking state when volume is detected
  useEffect(() => {
    if (volume > AUDIO_OUTPUT_DETECTION_THRESHOLD) {
      setIsTalking(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Enforce a slight delay between end of audio output and setting talking state to false
      timeoutRef.current = window.setTimeout( // Explicitly use window.setTimeout
        () => setIsTalking(false),
        TALKING_STATE_COOLDOWN_MS
      );
    }
  }, [volume]);

  // Render the face on the canvas if no imageUrl
  useEffect(() => {
    if (!imageUrl && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')!;
      renderBasicFace({ ctx, mouthScale, eyeScale, color });
    }
  }, [canvasRef, volume, eyeScale, mouthScale, color, scale, imageUrl]);

  const faceSize = radius * 2 * scale;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="Avatar"
        className="basic-face-image"
        style={{
          width: `${faceSize}px`,
          height: `${faceSize}px`,
          transform: `translateY(${hoverPosition}px) rotate(${tiltAngle}deg)`,
        }}
      />
    );
  }

  return (
    <canvas
      className="basic-face-canvas"
      ref={canvasRef}
      width={faceSize}
      height={faceSize}
      style={{
        display: 'block',
        borderRadius: '50%',
        transform: `translateY(${hoverPosition}px) rotate(${tiltAngle}deg)`,
      }}
    />
  );
}
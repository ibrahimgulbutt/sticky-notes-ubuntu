import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

interface PlantVisualizationProps {
  progress: number; // 0 to 1
  isPaused: boolean;
}

const PlantVisualization: React.FC<PlantVisualizationProps> = ({ progress, isPaused }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const propsRef = useRef({ progress, isPaused });

  useEffect(() => {
    propsRef.current = { progress, isPaused };
  }, [progress, isPaused]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      p.setup = () => {
        const { clientWidth, clientHeight } = containerRef.current!;
        p.createCanvas(clientWidth, clientHeight);
        p.angleMode(p.DEGREES);
        p.frameRate(30);
      };

      p.windowResized = () => {
        if (containerRef.current) {
          const { clientWidth, clientHeight } = containerRef.current;
          p.resizeCanvas(clientWidth, clientHeight);
        }
      };

      p.draw = () => {
        p.clear();
        p.translate(p.width / 2, p.height);
        
        const { progress, isPaused } = propsRef.current;
        
        // Growth logic: Map progress (0-1) to tree size
        // Scale based on height
        const maxLen = p.height * 0.3; // 30% of height
        const minLen = p.height * 0.06; // 6% of height
        const targetLen = p.map(progress, 0, 1, minLen, maxLen);
        
        // Sway animation
        const sway = isPaused ? 0 : p.sin(p.frameCount * 1) * 3;
        
        // Color: Greenish
        p.stroke(100, 255, 150);
        // Thickness grows with progress
        p.strokeWeight(Math.max(1, p.map(progress, 0, 1, 1, p.height * 0.015)));
        
        branch(targetLen, sway);
      };

      function branch(len: number, sway: number) {
        p.line(0, 0, 0, -len);
        p.translate(0, -len);
        
        if (len > p.height * 0.03) { // Stop recursion based on relative size
          p.push();
          p.rotate(25 + sway);
          branch(len * 0.7, sway);
          p.pop();
          
          p.push();
          p.rotate(-25 + sway);
          branch(len * 0.7, sway);
          p.pop();
        }
      }
    };

    p5Instance.current = new p5(sketch, containerRef.current);
    
    // Add ResizeObserver to trigger p.windowResized
    const resizeObserver = new ResizeObserver(() => {
      p5Instance.current?.windowResized();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      p5Instance.current?.remove();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 flex items-center justify-center pointer-events-none" />;
};

export default PlantVisualization;

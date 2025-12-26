import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

interface BlobVisualizationProps {
  progress: number;
  isPaused: boolean;
}

const BlobVisualization: React.FC<BlobVisualizationProps> = ({ progress, isPaused }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const propsRef = useRef({ progress, isPaused });

  useEffect(() => {
    propsRef.current = { progress, isPaused };
  }, [progress, isPaused]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let yoff = 0.0;

      p.setup = () => {
        const { clientWidth, clientHeight } = containerRef.current!;
        p.createCanvas(clientWidth, clientHeight);
        p.frameRate(30);
        p.noStroke();
      };

      p.windowResized = () => {
        if (containerRef.current) {
          const { clientWidth, clientHeight } = containerRef.current;
          p.resizeCanvas(clientWidth, clientHeight);
        }
      };

      p.draw = () => {
        p.clear();
        p.translate(p.width / 2, p.height / 2);

        const { progress, isPaused } = propsRef.current;
        
        // Radius grows with progress
        // Scale based on smallest dimension
        const minDim = Math.min(p.width, p.height);
        const minRadius = minDim * 0.15;
        const maxRadius = minDim * 0.4;
        const radius = p.map(progress, 0, 1, minRadius, maxRadius);
        
        // Color: Cyan/Blue with transparency
        p.fill(0, 200, 255, 100); 
        
        p.beginShape();
        let xoff = 0;
        for (let a = 0; a < p.TWO_PI; a += 0.1) {
          let offset = p.map(p.noise(xoff, yoff), 0, 1, -minDim * 0.05, minDim * 0.05);
          let r = radius + offset;
          let x = r * p.cos(a);
          let y = r * p.sin(a);
          p.vertex(x, y);
          xoff += 0.1;
        }
        p.endShape(p.CLOSE);

        if (!isPaused) {
          yoff += 0.01;
        }
      };
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

export default BlobVisualization;

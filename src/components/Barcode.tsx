import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  width = 1.6,
  height = 42,
  displayValue = false,
  fontSize = 12,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize,
          font: 'monospace',
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 2,
          background: 'transparent',
          lineColor: '#2E2015',
          margin: 0,
        });
      } catch (err) {
        console.error('Gagal generate barcode:', err);
      }
    }
  }, [value, width, height, displayValue, fontSize]);

  if (!value) return null;

  return (
    <svg
      ref={svgRef}
      className={`mx-auto max-w-full ${className}`}
      aria-label={`Barcode untuk ${value}`}
    />
  );
};

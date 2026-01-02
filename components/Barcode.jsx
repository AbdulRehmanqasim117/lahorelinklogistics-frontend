import React from 'react';

const patterns = {
  '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
  '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
  '8': '110100101101', '9': '101100101101',
  'A': '110101001011', 'B': '101101001011', 'C': '110110100101', 'D': '101011001011',
  'E': '110101100101', 'F': '101101100101', 'G': '101010011011', 'H': '110101001101',
  'I': '101101001101', 'J': '101011001101', 'K': '110101010011', 'L': '101101010011',
  'M': '110110101001', 'N': '101011010011', 'O': '110101101001', 'P': '101101101001',
  'Q': '101010110011', 'R': '110101011001', 'S': '101101011001', 'T': '101011011001',
  'U': '110010101011', 'V': '100110101011', 'W': '110011010101', 'X': '100101101011',
  'Y': '110010110101', 'Z': '100110110101', '-': '100101011011', '.': '110010101101',
  ' ': '100110101101', '$': '100100100101', '/': '100100101001', '+': '100101001001',
  '%': '101001001001', '*': '100101101101' // Start/stop
};

const Barcode = ({ value, height = 60, barWidth = 2, targetWidth, showValue = true, className = "" }) => {
  // Support both numeric height and Tailwind class names
  const isTailwindHeight = typeof height === 'string' && height.startsWith('h-');
  const heightValue = isTailwindHeight ? 
    (height === 'h-6' ? 24 : height === 'h-8' ? 32 : height === 'h-10' ? 40 : 40) : 
    height;
  
  if (!value) {
    return <div className={`${className} ${isTailwindHeight ? height : ''} border border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-500`}>[BARCODE]</div>;
  }
  
  const text = `*${String(value).toUpperCase()}*`;
  let seq = '';
  for (const ch of text) {
    const p = patterns[ch] || patterns['-'];
    seq += p + '0';
  }
  const bars = [];
  let x = 0;
  for (const bit of seq) {
    const w = barWidth;
    if (bit === '1') {
      bars.push(<rect key={x} x={x} y={0} width={w} height={heightValue} fill="#000" />);
    }
    x += w;
  }
  const width = targetWidth || x;
  
  return (
    <div className={className}>
      <svg 
        width={isTailwindHeight ? "100%" : width} 
        height={isTailwindHeight ? height : heightValue} 
        viewBox={`0 0 ${x} ${heightValue}`} 
        xmlns="http://www.w3.org/2000/svg" 
        shapeRendering="crispEdges"
        preserveAspectRatio="none"
        style={isTailwindHeight ? { display: 'block' } : {}}
      >
        {bars}
      </svg>
      {showValue && value && (
        <div className="text-xs text-center mt-1">{value}</div>
      )}
    </div>
  );
};

export default Barcode;

const SheetMusicSVG = () => (
  <svg viewBox="0 0 400 120" className="w-full max-w-md mx-auto" fill="none">
    {[30, 40, 50, 60, 70].map((y) => (
      <line key={y} x1="10" y1={y} x2="390" y2={y} stroke="#1a1a2e" strokeWidth="0.8" opacity="0.3" />
    ))}
    <text x="20" y="62" fontSize="40" fill="#1a1a2e" opacity="0.7" fontFamily="serif">𝄞</text>
    <text x="60" y="48" fontSize="16" fill="#1a1a2e" opacity="0.7" fontFamily="serif" fontWeight="bold">4</text>
    <text x="60" y="65" fontSize="16" fill="#1a1a2e" opacity="0.7" fontFamily="serif" fontWeight="bold">4</text>
    {[95, 130, 165, 200, 245, 280, 315, 350].map((x, i) => (
      <g key={i}>
        <ellipse cx={x} cy={[60, 50, 55, 45, 60, 50, 55, 40][i]} rx="6" ry="4.5" fill="#1a1a2e" opacity="0.7" transform={`rotate(-15 ${x} ${[60, 50, 55, 45, 60, 50, 55, 40][i]})`} />
        <line x1={x + 5} y1={[60, 50, 55, 45, 60, 50, 55, 40][i] - 3} x2={x + 5} y2={[60, 50, 55, 45, 60, 50, 55, 40][i] - 28} stroke="#1a1a2e" strokeWidth="1.2" opacity="0.7" />
      </g>
    ))}
    <line x1="230" y1="30" x2="230" y2="70" stroke="#1a1a2e" strokeWidth="1" opacity="0.3" />
  </svg>
);

export default SheetMusicSVG;

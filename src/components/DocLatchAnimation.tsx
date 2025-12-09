import React from 'react';

interface DocLatchAnimationProps {
  text?: string;
  width?: number | string;
  height?: number | string;
}

const DocLatchAnimation: React.FC<DocLatchAnimationProps> = ({
  text = 'Extracting Data → Updating Dashboard…',
  width = 170,
  height = 150,
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    margin: '40px auto',
    perspective: '600px',
    fontFamily: '"Inter", sans-serif',
  };

  const pageStyle: React.CSSProperties = {
    position: 'absolute',
    width: '90px',
    height: '110px',
    background: '#ffffff',
    border: '2px solid #3B78E7',
    borderRadius: '4px',
    left: '15px',
    top: '10px',
    transformOrigin: 'left center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
    animation: 'flipPage 1.8s ease-in-out infinite',
  };

  const scanBeamStyle: React.CSSProperties = {
    position: 'absolute',
    width: '90px',
    height: '6px',
    background: 'rgba(66,150,255,0.35)',
    borderRadius: '3px',
    top: '10px',
    left: '15px',
    animation: 'beamMove 1.8s ease-in-out infinite',
  };

  const dataLineStyle: React.CSSProperties = {
    position: 'absolute',
    width: '45px',
    height: '3px',
    background: '#3B78E7',
    borderRadius: '2px',
    left: '110px',
    opacity: 0,
    animation: 'dataMove 1.8s ease-in-out infinite',
  };

  const dashboardIconStyle: React.CSSProperties = {
    position: 'absolute',
    right: '5px',
    top: '50px',
    width: '24px',
    height: '24px',
    border: '2px solid #2E7FE8',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    padding: '3px',
    gap: '3px',
    boxShadow: '0 0 10px rgba(46,127,232,0.45)',
    animation: 'dashPulse 1.6s ease-in-out infinite',
  };

  const barStyle = (width: string): React.CSSProperties => ({
    height: '3px',
    background: '#2E7FE8',
    borderRadius: '2px',
    width,
  });

  const textStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-35px',
    width: '100%',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 500,
    color: '#3A3A3A',
    opacity: 0.85,
  };

  const styleTag = `
    @keyframes flipPage {
      0%   { transform: rotateY(0deg); opacity: 1; }
      40%  { transform: rotateY(-90deg); opacity: 0.7; }
      70%  { transform: rotateY(-160deg); opacity: 0.4; }
      100% { transform: rotateY(-180deg); opacity: 0; }
    }
    
    @keyframes beamMove {
      0%   { top: 10px; opacity: 0; }
      20%  { opacity: 0.8; }
      50%  { top: 100px; opacity: 1; }
      80%  { opacity: 0.3; }
      100% { top: 100px; opacity: 0; }
    }
    
    @keyframes dataMove {
      0%   { transform: translateX(0); opacity: 0; }
      40%  { opacity: 1; }
      100% { transform: translateX(40px); opacity: 0; }
    }
    
    @keyframes dashPulse {
      0%,100% { transform: scale(1); }
      50%     { transform: scale(1.12); }
    }
  `;

  return (
    <>
      <style>{styleTag}</style>
      <div style={containerStyle}>
        <div style={{ ...pageStyle, animationDelay: '0s' }}></div>
        <div style={{ ...pageStyle, animationDelay: '0.3s' }}></div>
        <div style={{ ...pageStyle, animationDelay: '0.6s' }}></div>

        <div style={scanBeamStyle}></div>

        <div style={{ ...dataLineStyle, top: '32px', animationDelay: '0.2s' }}></div>
        <div style={{ ...dataLineStyle, top: '57px', animationDelay: '0.4s' }}></div>
        <div style={{ ...dataLineStyle, top: '82px', animationDelay: '0.6s' }}></div>

        <div style={dashboardIconStyle}>
          <div style={barStyle('70%')}></div>
          <div style={barStyle('100%')}></div>
          <div style={barStyle('55%')}></div>
        </div>

        <div style={textStyle}>{text}</div>
      </div>
    </>
  );
};

export default DocLatchAnimation;

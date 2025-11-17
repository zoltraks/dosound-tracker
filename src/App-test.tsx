import React from 'react';

const AppTest: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      backgroundColor: '#000', 
      color: '#0f0',
      height: '100vh',
      width: '100vw'
    }}>
      <h1>DOSOUND Tracker - Test Version</h1>
      <p>If you can see this, the basic React setup is working.</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

export default AppTest;

import React from 'react';
import './Tabs.css';

const Tabs = ({ mindmaps, activeMindmapId, onTabClick, onAddTab, onCloseTab }) => {
  return (
    <div className="tabs">
      {mindmaps.map(mindmap => (
        <div
          key={mindmap.id}
          className={`tab ${mindmap.id === activeMindmapId ? 'active' : ''}`}
          onClick={() => onTabClick(mindmap.id)}
        >
          {mindmap.name}
          <button className="close-tab" onClick={(e) => { e.stopPropagation(); onCloseTab(mindmap.id); }}>x</button>
        </div>
      ))}
      <button className="add-tab" onClick={onAddTab}>+</button>
    </div>
  );
};

export default Tabs;
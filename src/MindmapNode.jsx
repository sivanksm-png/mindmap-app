import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import './MindmapNode.css';

const handleStyle = { opacity: 0, width: '1px', height: '1px', border: 0 };

const MindmapNode = ({ id, data, selected, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const inputRef = useRef(null);
  const colorPickerRef = useRef(null);
  const colorButtonRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setLabel(data.label);
  }, [data.label]);

  // Click outside to close color picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColorPicker) {
        const isClickInsideColorPicker = colorPickerRef.current && colorPickerRef.current.contains(event.target);
        const isClickOnColorButton = colorButtonRef.current && colorButtonRef.current.contains(event.target);
        
        if (!isClickInsideColorPicker && !isClickOnColorButton) {
          console.log('Closing color picker due to outside click');
          setShowColorPicker(false);
        }
      }
    };

    if (showColorPicker) {
      // Use both mousedown and click events for better compatibility
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('click', handleClickOutside);
      // Also listen for React Flow events
      document.addEventListener('click', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showColorPicker]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    if (label.trim() !== '') {
      data.onLabelChange(id, label);
    } else {
      setLabel(data.label);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleBlur();
    }
  };


  const nodeStyle = {
    background: data.color || '#fff',
  };

  return (
    <div className={`mindmap-node ${className || ''} ${data.isConnecting ? 'connecting' : ''} ${data.connectionMode && !data.isSelected ? 'selectable' : ''} ${data.isSelected ? 'selected' : ''} ${!data.canDrag ? 'no-drag' : ''}`} style={nodeStyle} onDoubleClick={handleDoubleClick} data-id={id}>
      <Handle type="source" position={Position.Top} id="top" style={handleStyle} />
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="target" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="bottom" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="left" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="left" style={handleStyle} />

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="nodrag"
        />
      ) : (
        <>
          <div ref={colorButtonRef} className="color-button" onClick={(evt) => { evt.stopPropagation(); setShowColorPicker(!showColorPicker); }}>🎨</div>
          <div className={`connection-mode-button ${data.isSelected ? 'active' : ''}`} onClick={(evt) => { evt.stopPropagation(); data.onToggleConnectionMode && data.onToggleConnectionMode(id); }}>🔗</div>
          <div>{data.label}</div>
          <div className={`handle top ${data.connectionMode ? 'connection-mode' : ''}`} 
               onClick={(evt) => { evt.stopPropagation(); data.connectionMode ? data.onConnectFromHandle && data.onConnectFromHandle(id, 'top') : data.onAddNode('top', id) }} 
               onMouseDown={(evt) => { evt.stopPropagation(); data.onStartConnection(id, 'top', evt) }}
               onMouseUp={(evt) => { evt.stopPropagation(); data.onEndConnection && data.onEndConnection(id, 'top', evt) }}
               onMouseEnter={(evt) => { evt.stopPropagation(); data.onHandleMouseEnter && data.onHandleMouseEnter(id, 'top') }}>+</div>
          <div className={`handle right ${data.connectionMode ? 'connection-mode' : ''}`} 
               onClick={(evt) => { evt.stopPropagation(); data.connectionMode ? data.onConnectFromHandle && data.onConnectFromHandle(id, 'right') : data.onAddNode('right', id) }} 
               onMouseDown={(evt) => { evt.stopPropagation(); data.onStartConnection(id, 'right', evt) }}
               onMouseUp={(evt) => { evt.stopPropagation(); data.onEndConnection && data.onEndConnection(id, 'right', evt) }}
               onMouseEnter={(evt) => { evt.stopPropagation(); data.onHandleMouseEnter && data.onHandleMouseEnter(id, 'right') }}>+</div>
          <div className={`handle bottom ${data.connectionMode ? 'connection-mode' : ''}`} 
               onClick={(evt) => { evt.stopPropagation(); data.connectionMode ? data.onConnectFromHandle && data.onConnectFromHandle(id, 'bottom') : data.onAddNode('bottom', id) }} 
               onMouseDown={(evt) => { evt.stopPropagation(); data.onStartConnection(id, 'bottom', evt) }}
               onMouseUp={(evt) => { evt.stopPropagation(); data.onEndConnection && data.onEndConnection(id, 'bottom', evt) }}
               onMouseEnter={(evt) => { evt.stopPropagation(); data.onHandleMouseEnter && data.onHandleMouseEnter(id, 'bottom') }}>+</div>
          <div className={`handle left ${data.connectionMode ? 'connection-mode' : ''}`} 
               onClick={(evt) => { evt.stopPropagation(); data.connectionMode ? data.onConnectFromHandle && data.onConnectFromHandle(id, 'left') : data.onAddNode('left', id) }} 
               onMouseDown={(evt) => { evt.stopPropagation(); data.onStartConnection(id, 'left', evt) }}
               onMouseUp={(evt) => { evt.stopPropagation(); data.onEndConnection && data.onEndConnection(id, 'left', evt) }}
               onMouseEnter={(evt) => { evt.stopPropagation(); data.onHandleMouseEnter && data.onHandleMouseEnter(id, 'left') }}>+</div>
          <div className="delete-handle" onClick={(evt) => { evt.stopPropagation(); data.onDeleteNode(id); }}>-</div>
        </>
      )}
      {showColorPicker && (
        <>
          {/* Background overlay to catch clicks */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
              background: 'transparent'
            }}
            onClick={() => {
              console.log('Overlay clicked, closing color picker');
              setShowColorPicker(false);
            }}
          />
          {/* Color picker */}
          <div ref={colorPickerRef} className="color-picker" style={{ 
            position: 'absolute', 
            top: '-80px', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            background: 'white',
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            border: '2px solid #007bff',
            maxWidth: '200px',
            justifyContent: 'center'
          }}>
            {['#FFE5E5', '#FFE5F1', '#F0E5FF', '#E5E5FF', '#E5F0FF', '#E5FFE5', '#F0FFE5', '#FFFFE5', '#FFE5CC', '#FFCCE5'].map(color => (
              <div
                key={color}
                className="color-swatch"
                style={{ 
                  backgroundColor: color,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  border: '2px solid #ccc',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  data.onColorChange(id, color);
                  setShowColorPicker(false);
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.borderColor = '#007bff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.borderColor = '#ccc';
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default memo(MindmapNode);

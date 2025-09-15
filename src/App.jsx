import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow,
{
  ReactFlowProvider,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

import MindmapNode from './MindmapNode';
import Tabs from './Tabs';
import './MindmapNode.css';
import './App.css';
import './Tabs.css';

const nodeTypes = { mindmapNode: MindmapNode };

let mindmapIdCounter = 2;
let nodeIdCounter = 2;
const HORIZONTAL_SPACING = 100;
const VERTICAL_SPACING = 50;

const createNewNode = (label = '새 노드', className) => {
  const nodeId = `${nodeIdCounter++}`;
  const node = {
    id: nodeId,
    type: 'mindmapNode',
    position: { x: 0, y: 0 },
    data: { label },
  };
  if (className) {
    node.className = className;
  }
  return node;
};

function App() {
  const [mindmaps, setMindmaps] = useState([
    {
      id: 1,
      name: '마인드맵 1',
      nodes: [createNewNode('핵심 주제', 'root-node')],
      edges: [],
    },
  ]);
  const [activeMindmapId, setActiveMindmapId] = useState(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportText, setExportText] = useState('');
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [loadJsonText, setLoadJsonText] = useState('');
  const [highlightedEdge, setHighlightedEdge] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionMode, setConnectionMode] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [connectionStartInfo, setConnectionStartInfo] = useState(null);

  const activeMindmap = mindmaps.find((m) => m.id === activeMindmapId);

  const updateActiveMindmap = (updater) => {
    setMindmaps((prevMindmaps) =>
      prevMindmaps.map((mindmap) => {
        if (mindmap.id === activeMindmapId) {
          return updater(mindmap);
        }
        return mindmap;
      })
    );
  };

  const setNodes = (updater) => {
    updateActiveMindmap((mindmap) => ({
      ...mindmap,
      nodes: typeof updater === 'function' ? updater(mindmap.nodes) : updater,
    }));
  };

  const setEdges = (updater) => {
    updateActiveMindmap((mindmap) => ({
      ...mindmap,
      edges: typeof updater === 'function' ? updater(mindmap.edges) : updater,
    }));
  };

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [activeMindmapId]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [activeMindmapId]
  );

  // 점선 연결선 삭제 함수
  const onEdgeDoubleClick = useCallback(
    (event, edge) => {
      // 점선 연결선만 삭제 가능
      if (edge.className === 'dashed-edge') {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
    },
    []
  );

  // 점선 연결선 우클릭으로 삭제
  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      // 점선 연결선만 삭제 가능
      if (edge.className === 'dashed-edge') {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
    },
    []
  );

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    (event) => {
      console.log('파일 선택 이벤트 발생!', event);
      const file = event.target.files[0];
      console.log('선택된 파일:', file);
      
      if (!file) {
        console.log('파일이 선택되지 않음');
        alert('파일을 선택해주세요.');
        return;
      }

      console.log('파일 정보:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // 파일 확장자 확인
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
        console.log('지원하지 않는 파일 형식:', fileName);
        alert('JSON 또는 TXT 파일만 선택할 수 있습니다.');
        return;
      }

      // 파일 크기 확인 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        console.log('파일 크기 초과:', file.size);
        alert('파일 크기가 너무 큽니다. 5MB 이하의 파일을 선택해주세요.');
        return;
      }

      console.log('파일 읽기 시작');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          console.log('파일 내용 읽기 완료, 길이:', content.length);
          console.log('파일 내용 미리보기:', content.substring(0, 100));
          
          // 파일 내용을 바로 마인드맵으로 로드
          handleLoadFromText(content);
          console.log('파일 내용을 마인드맵으로 직접 로드 완료');
          alert(`파일 "${file.name}"이 성공적으로 로드되었습니다!`);
        } catch (error) {
          console.error('파일 읽기 중 오류:', error);
          alert('파일을 읽는 중 오류가 발생했습니다.');
        }
      };
      reader.onerror = (error) => {
        console.error('파일 리더 오류:', error);
        alert('파일을 읽는 중 오류가 발생했습니다.');
      };
      reader.readAsText(file, 'UTF-8');
    },
    []
  );


  const onConnect = useCallback(
    (params) => {
      // 새로 생성된 연결선에 점선 스타일 적용
      const newEdge = {
        ...params,
        style: {
          stroke: '#666666',
          strokeWidth: 2,
          strokeDasharray: '5,5', // 점선 효과
        },
        className: 'dashed-edge',
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [activeMindmapId]
  );

  // + 버튼 드래그로 연결 시작
  const onStartConnection = useCallback(
    (nodeId, direction, event) => {
      event.preventDefault();
      event.stopPropagation();
      
      setIsConnecting(true);
      setConnectionStart({ nodeId, direction });
      
      // 마우스 이벤트 리스너 추가
      const handleMouseMove = (e) => {
        // 마우스 이동 시 시각적 피드백
      };
      
      const handleMouseUp = (e) => {
        // 마우스 업 시 연결 완료 처리
        if (false) { // 오래된 드래그 앤 드롭 코드 비활성화
          // 마우스 위치에서 가장 가까운 + 버튼 찾기
          const targetElement = document.elementFromPoint(e.clientX, e.clientY);
          if (targetElement && targetElement.classList.contains('handle')) {
            const targetNode = targetElement.closest('.mindmap-node');
            if (targetNode) {
              const targetNodeId = targetNode.getAttribute('data-id');
              const targetDirection = targetElement.classList.contains('top') ? 'top' :
                                   targetElement.classList.contains('right') ? 'right' :
                                   targetElement.classList.contains('bottom') ? 'bottom' : 'left';
              
              if (false && targetNodeId && targetNodeId !== 'disabled') {
                const newEdge = {
                  id: `connection-disabled`,
                  source: 'disabled',
                  target: 'disabled',
                  sourceHandle: 'disabled',
                  targetHandle: targetDirection,
                  style: {
                    stroke: '#666666',
                    strokeWidth: 2,
                    strokeDasharray: '5,5',
                  },
                  className: 'dashed-edge',
                };
                setEdges((eds) => addEdge(newEdge, eds));
              }
            }
          }
        }
        
        setIsConnecting(false);
        setConnectionStart(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    []
  );

  // + 버튼에 마우스 오버 시 연결 가능 상태 표시
  const onHandleMouseEnter = useCallback(
    (nodeId, direction) => {
      if (false) { // 오래된 코드 비활성화
        // 연결 가능한 상태 표시
      }
    },
    []
  );

  // + 버튼 클릭으로 연결 완료
  const onCompleteConnection = useCallback(
    (targetNodeId, targetDirection) => {
      if (false) { // 오래된 코드 비활성화
        const newEdge = {
          id: `connection-disabled`,
          source: 'disabled',
          target: 'disabled',
          sourceHandle: 'disabled',
          targetHandle: targetDirection,
          style: {
            stroke: '#666666',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
          className: 'dashed-edge',
        };
        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    []
  );

  // + 버튼 마우스 업으로 연결 완료
  const onEndConnection = useCallback(
    (nodeId, direction, event) => {
      if (false) { // 오래된 코드 비활성화
        const newEdge = {
          id: `connection-disabled`,
          source: 'disabled',
          target: 'disabled',
          sourceHandle: 'disabled',
          targetHandle: direction,
          style: {
            stroke: '#666666',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
          className: 'dashed-edge',
        };
        setEdges((eds) => addEdge(newEdge, eds));
        setIsConnecting(false);
        setConnectionStart(null);
      } else {
        setIsConnecting(false);
        setConnectionStart(null);
      }
    },
    []
  );

  // 연결 모드 강제 종료
  const forceExitConnectionMode = useCallback(() => {
    setConnectionMode(false);
    setSelectedNodes([]);
    setConnectionStartInfo(null);
  }, []);

  // 연결 모드 토글
  const onToggleConnectionMode = useCallback(
    (nodeId) => {
      if (!connectionMode) {
        // 연결 모드 시작
        setConnectionMode(true);
        setSelectedNodes([]);
        setConnectionStartInfo(null);
      } else {
        // 연결 모드 취소
        forceExitConnectionMode();
      }
    },
    [connectionMode, forceExitConnectionMode]
  );

  // + 버튼에서 연결 시작
  const onConnectFromHandle = useCallback(
    (nodeId, direction) => {
      if (!connectionMode) {
        return;
      }

      if (!connectionStartInfo) {
        // 첫 번째 + 버튼 클릭 - 시작 노드와 방향 저장
        setConnectionStartInfo({ nodeId, direction });
        setSelectedNodes([nodeId]);
      } else {
        // 두 번째 + 버튼 클릭 - 연결 생성
        const newEdge = {
          id: `connection-${connectionStartInfo.nodeId}-${nodeId}`,
          source: connectionStartInfo.nodeId,
          target: nodeId,
          sourceHandle: connectionStartInfo.direction,
          targetHandle: direction,
          style: {
            stroke: '#666666',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
          className: 'dashed-edge',
        };
        setEdges((eds) => addEdge(newEdge, eds));
        
        // 연결 모드 종료
        forceExitConnectionMode();
      }
    },
    [connectionMode, connectionStartInfo, forceExitConnectionMode]
  );

  // ESC 키로 연결 모드 취소
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && connectionMode) {
        forceExitConnectionMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [connectionMode, forceExitConnectionMode]);

  // 연결 모드 상태 디버깅용 로그
  useEffect(() => {
    console.log('Connection mode:', connectionMode, 'Selected nodes:', selectedNodes);
  }, [connectionMode, selectedNodes]);

  const dragInfoRef = useRef(null);

  const onNodeDragStart = useCallback(
    (event, node) => {
      // 연결 모드가 활성화되어 있으면 드래그 차단
      if (connectionMode) {
        event.preventDefault();
        return false;
      }
      
      const initialPositions = new Map();
      const nodesById = new Map();
      activeMindmap.nodes.forEach((n) => {
        initialPositions.set(n.id, n.position);
        nodesById.set(n.id, n);
      });

      const edgesBySource = new Map();
      activeMindmap.edges.forEach((e) => {
        if (!edgesBySource.has(e.source)) {
          edgesBySource.set(e.source, []);
        }
        edgesBySource.get(e.source).push(e);
      });

      dragInfoRef.current = {
        initialPositions,
        nodesById,
        edgesBySource,
      };
    },
    [activeMindmap, connectionMode]
  );

  const onNodeDrag = useCallback(
    (event, node) => {
      // 연결 모드가 활성화되어 있으면 드래그 차단
      if (connectionMode) {
        event.preventDefault();
        return;
      }
      
      if (!dragInfoRef.current) {
        return;
      }

      const { initialPositions, nodesById, edgesBySource } = dragInfoRef.current;

      const startPos = initialPositions.get(node.id);
      if (!startPos) {
        return;
      }

      const dx = node.position.x - startPos.x;
      const dy = node.position.y - startPos.y;

      const getChildNodes = (nodeId) => {
        const children = [];
        const queue = [nodeId];
        const visited = new Set();

        while (queue.length > 0) {
          const currentId = queue.shift();
          if (visited.has(currentId)) continue;
          visited.add(currentId);

          const childEdges = edgesBySource.get(currentId) || [];

          for (const edge of childEdges) {
            if (!visited.has(edge.target)) {
              const childNode = nodesById.get(edge.target);
              if (childNode) {
                children.push(childNode);
                queue.push(childNode.id);
              }
            }
          }
        }
        return children;
      };

      const childNodes = getChildNodes(node.id);

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return node;
          }

          const isChild = childNodes.some((child) => child.id === n.id);
          if (isChild) {
            const initialPos = initialPositions.get(n.id);
            if (initialPos) {
              return {
                ...n,
                position: {
                  x: initialPos.x + dx,
                  y: initialPos.y + dy,
                },
              };
            }
          }
          return n;
        })
      );
    },
    [activeMindmapId, connectionMode]
  );

  const onNodeDragStop = useCallback(() => {
    // 연결 모드가 활성화되어 있으면 드래그 차단
    if (connectionMode) {
      return;
    }
    
    dragInfoRef.current = null;
  }, [connectionMode]);

  const onLabelChange = useCallback(
    (nodeId, newLabel) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return { ...n, data: { ...n.data, label: newLabel } };
          }
          return n;
        })
      );
    },
    [activeMindmapId]
  );

  const onColorChange = useCallback(
    (nodeId, newColor) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return { ...n, data: { ...n.data, color: newColor } };
          }
          return n;
        })
      );
      
      // 해당 노드에서 나가는 연결선들의 색상도 업데이트
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.source === nodeId) {
            return {
              ...edge,
              style: {
                ...edge.style,
                stroke: newColor || '#1a192b',
              },
            };
          }
          return edge;
        })
      );
    },
    [activeMindmapId]
  );

  const onDeleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
    },
    [activeMindmapId]
  );

  // 파스텔톤 색상을 원색으로 변환하는 함수
  const getDarkerColor = (pastelColor) => {
    const colorMap = {
      '#FFE5E5': '#FF6B6B', // 연한 분홍 → 진한 분홍
      '#FFE5CC': '#FF9800', // 연한 주황 → 진한 주황
      '#FFFFE5': '#FFEB3B', // 연한 노랑 → 진한 노랑
      '#F0FFE5': '#8BC34A', // 연한 라임 → 진한 라임
      '#E5FFE5': '#4CAF50', // 연한 초록 → 진한 초록
      '#E0F2F1': '#009688', // 연한 민트 → 진한 민트
      '#E5F5FF': '#00BCD4', // 연한 하늘 → 진한 하늘
      '#E5E5FF': '#673AB7', // 연한 보라 → 진한 보라
      '#F0E5FF': '#9C27B0', // 연한 라벤더 → 진한 라벤더
      '#FFCCE5': '#E91E63', // 연한 로즈 → 진한 로즈
      '#FFF8E1': '#FFC107', // 연한 크림 → 진한 크림
      '#F3E5F5': '#9C27B0', // 연한 라일락 → 진한 라일락
      '#E8F5E8': '#4CAF50', // 연한 시트론 → 진한 시트론
      '#F0F8FF': '#2196F3', // 연한 앨리스블루 → 진한 앨리스블루
      '#FFE4E1': '#FF6B6B'  // 연한 미스트로즈 → 진한 미스트로즈
    };
    return colorMap[pastelColor] || '#1a192b';
  };


  const onAddNode = useCallback(
    (direction, sourceNodeId) => {
      const currentNodes = activeMindmap.nodes;
      const sourceNode = currentNodes.find((n) => n.id === sourceNodeId);
      if (!sourceNode) return;

      const newNode = createNewNode();
      // 루트 노드가 아닌 경우에만 부모 색상 상속
      if (sourceNode.data.color && sourceNode.className !== 'root-node') {
        newNode.data.color = sourceNode.data.color;
      } else if (sourceNode.className === 'root-node') {
        // 루트 노드에서 자식 노드를 만들 때 파스텔톤 색상 랜덤 선택 (중복 방지)
        const pastelColors = [
          '#FFE5E5', // 연한 분홍
          '#FFE5CC', // 연한 주황
          '#FFFFE5', // 연한 노랑
          '#F0FFE5', // 연한 라임
          '#E5FFE5', // 연한 초록
          '#E0F2F1', // 연한 민트
          '#E5F5FF', // 연한 하늘
          '#E5E5FF', // 연한 보라
          '#F0E5FF', // 연한 라벤더
          '#FFCCE5', // 연한 로즈
          '#FFF8E1', // 연한 크림
          '#F3E5F5', // 연한 라일락
          '#E8F5E8', // 연한 시트론
          '#F0F8FF', // 연한 앨리스블루
          '#FFE4E1'  // 연한 미스트로즈
        ];
        
        // 현재 사용 중인 색상들 가져오기
        const usedColors = new Set();
        currentNodes.forEach(node => {
          if (node.data.color && node.className !== 'root-node') {
            usedColors.add(node.data.color);
          }
        });
        
        // 사용 가능한 색상들 필터링
        const availableColors = pastelColors.filter(color => !usedColors.has(color));
        
        // 사용 가능한 색상이 있으면 그 중에서 선택, 없으면 전체에서 랜덤 선택
        const colorsToChooseFrom = availableColors.length > 0 ? availableColors : pastelColors;
        const randomColor = colorsToChooseFrom[Math.floor(Math.random() * colorsToChooseFrom.length)];
        newNode.data.color = randomColor;
      }

      const sourceWidth = sourceNode.width || 150;
      const sourceHeight = sourceNode.height || 40;
      let newPosition = {};

      switch (direction) {
        case 'top':
          newPosition = {
            x: sourceNode.position.x,
            y: sourceNode.position.y - sourceHeight - VERTICAL_SPACING,
          };
          break;
        case 'right':
          newPosition = {
            x: sourceNode.position.x + sourceWidth + HORIZONTAL_SPACING,
            y: sourceNode.position.y,
          };
          break;
        case 'bottom':
          newPosition = {
            x: sourceNode.position.x,
            y: sourceNode.position.y + sourceHeight + VERTICAL_SPACING,
          };
          break;
        case 'left':
          newPosition = {
            x: sourceNode.position.x - sourceWidth - HORIZONTAL_SPACING,
            y: sourceNode.position.y,
          };
          break;
        default:
          return;
      }

      newNode.position = newPosition;

      const handleMap = {
        top: { sourceHandle: 'top', targetHandle: 'bottom' },
        right: { sourceHandle: 'right', targetHandle: 'left' },
        bottom: { sourceHandle: 'bottom', targetHandle: 'top' },
        left: { sourceHandle: 'left', targetHandle: 'right' },
      };
      const { sourceHandle, targetHandle } = handleMap[direction];

      // 소스 노드의 깊이 계산
      const sourceDepth = getNodeDepth(sourceNodeId, currentNodes, activeMindmap.edges);
      
      let strokeWidth = 3;
      let className = 'highlighted-edge';
      
      if (sourceNode.className === 'root-node') {
        // 루트 노드에서 직접 연결 (가장 두꺼움)
        strokeWidth = 7;
        className = 'root-edge highlighted-edge';
      } else if (sourceDepth === 1) {
        // 1단계 노드에서 연결 (중간 두께)
        strokeWidth = 3;
        className = 'level1-edge highlighted-edge';
      } else {
        // 2단계 이상 노드에서 연결 (얇음)
        strokeWidth = 2;
        className = 'level2-edge highlighted-edge';
      }

      const newEdge = {
        id: `e-${sourceNodeId}-${newNode.id}`,
        source: sourceNodeId,
        target: newNode.id,
        sourceHandle,
        targetHandle,
        style: {
          stroke: sourceNode.className === 'root-node' ? '#B8D4F0' : (sourceNode.data.color ? getDarkerColor(sourceNode.data.color) : '#1a192b'),
          strokeWidth: strokeWidth,
        },
        className: className,
      };

      setNodes((nds) => nds.concat(newNode));
      setEdges((eds) => eds.concat(newEdge));
      
      // 연결선 강조
      setHighlightedEdge(newEdge.id);
      
      // 3초 후 강조 해제
      setTimeout(() => {
        setHighlightedEdge(null);
        setEdges((eds) => 
          eds.map(edge => 
            edge.id === newEdge.id 
              ? { 
                  ...edge, 
                  style: { 
                    stroke: sourceNode.className === 'root-node' ? '#B8D4F0' : (sourceNode.data.color ? getDarkerColor(sourceNode.data.color) : '#1a192b'), 
                    strokeWidth: sourceNode.className === 'root-node' ? 6 : (sourceDepth === 1 ? 2.5 : 1.5)
                  }, 
                  className: sourceNode.className === 'root-node' ? 'root-edge' : (sourceDepth === 1 ? 'level1-edge' : 'level2-edge')
                }
              : edge
          )
        );
      }, 3000);
    },
    [activeMindmap]
  );

  const onSave = useCallback(async () => {
    const serializableNodes = activeMindmap.nodes.map((node) => {
      const { onAddNode, onLabelChange, onDeleteNode, ...restData } = node.data;
      return { ...node, data: restData };
    });

    const flow = { nodes: serializableNodes, edges: activeMindmap.edges };
    const blob = new Blob([JSON.stringify(flow, null, 2)], {
      type: 'application/json',
    });

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'mindmap.json',
          types: [
            {
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err.name, err.message);
        }
      }
    } else {
      const fileName = prompt(
        '파일 이름을 입력하세요 (예: my_mindmap.json)',
        'mindmap.json'
      );
      if (fileName === null || fileName.trim() === '') {
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [activeMindmap]);

  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      loadFlowFromJson(e.target.result, file.name);
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const onLoadFromFileClick = () => {
    fileInputRef.current.click();
  };

  const loadFlowFromJson = (jsonString, fileName) => {
    try {
      const flow = JSON.parse(jsonString);
      if (flow && flow.nodes && flow.edges) {
        const newMindmapId = mindmapIdCounter++;
        const newMindmap = {
          id: newMindmapId,
          name: fileName || `마인드맵 ${newMindmapId}`,
          nodes: flow.nodes,
          edges: flow.edges,
        };
        setMindmaps((prev) => [...prev, newMindmap]);
        setActiveMindmapId(newMindmapId);
        const maxId = Math.max(
          0,
          ...flow.nodes.map((n) => parseInt(n.id, 10) || 0)
        );
        nodeIdCounter = maxId + 1;
        return true;
      }
    } catch (error) {
      console.error('Error parsing JSON string:', error);
      alert(
        '데이터를 불러오는 데 실패했습니다. 올바른 JSON 형식인지 확인해주세요.'
      );
    }
    return false;
  };

  const parseNumberedText = (text) => {
    const newNodes = [];
    const newEdges = [];
    const prefixToNodeId = new Map();
    const lines = text.trim().split('\n');
    let maxId = 0;

    const rootPositions = {}; // y-coordinates for root nodes

    lines.forEach((line, index) => {
      const match = line.match(/^([\d\.]+) (.*)/);
      if (!match) return;

      const prefix = match[1];
      const label = match[2];
      const newId = `${++maxId}`;

      const prefixParts = prefix.split('.');
      const parentPrefix = prefixParts.slice(0, -1).join('.');
      const parentNodeId = prefixToNodeId.get(parentPrefix);

      let position = { x: 0, y: 0 };
      if (parentNodeId) {
        const parentNode = newNodes.find((n) => n.id === parentNodeId);
        const childIndex = lines
          .filter((l) => l.startsWith(parentPrefix + '.'))
          .indexOf(line);
        position = {
          x: parentNode.position.x + HORIZONTAL_SPACING,
          y: parentNode.position.y + childIndex * VERTICAL_SPACING,
        };
      } else {
        const rootIndex = Object.keys(rootPositions).length;
        position = { x: 0, y: rootIndex * VERTICAL_SPACING * 2 };
        rootPositions[prefix] = position.y;
      }

      newNodes.push({
        id: newId,
        type: 'mindmapNode',
        position,
        data: { label },
      });

      prefixToNodeId.set(prefix, newId);

      if (parentNodeId) {
        newEdges.push({
          id: `e-${parentNodeId}-${newId}`,
          source: parentNodeId,
          target: newId,
        });
      }
    });

    if (newNodes.length > 0) {
      const newMindmapId = mindmapIdCounter++;
      const newMindmap = {
        id: newMindmapId,
        name: `마인드맵 ${newMindmapId}`,
        nodes: newNodes,
        edges: newEdges,
      };
      setMindmaps((prev) => [...prev, newMindmap]);
      setActiveMindmapId(newMindmapId);
      nodeIdCounter = maxId + 1;
      return true;
    } else {
      alert('텍스트를 파싱할 수 없습니다. 형식을 확인해주세요. (예: 1. 항목1)');
      return false;
    }
  };

  const handleLoadFromText = () => {
    const text = loadJsonText.trim();
    if (!text) return;

    let success = false;
    if (text.startsWith('{')) {
      // JSON format
      success = loadFlowFromJson(text);
    } else {
      // Numbered text format
      success = parseNumberedText(text);
    }

    if (success) {
      setIsLoadModalOpen(false);
      setLoadJsonText('');
    }
  };

  const onExport = useCallback(() => {
    if (activeMindmap.nodes.length === 0) {
      setExportText('마인드맵에 노드가 없습니다.');
      setIsExportModalOpen(true);
      return;
    }
    const nodesById = new Map(activeMindmap.nodes.map((node) => [node.id, node]));
    const edgesBySource = new Map();
    for (const edge of activeMindmap.edges) {
      if (!edgesBySource.has(edge.source)) {
        edgesBySource.set(edge.source, []);
      }
      edgesBySource.get(edge.source).push(edge);
    }
    const targetIds = new Set(activeMindmap.edges.map((edge) => edge.target));

    const rootNodes = activeMindmap.nodes
      .filter((node) => !targetIds.has(node.id))
      .sort((a, b) => a.position.y - b.position.y);

    let text = '';
    const visited = new Set();

    const buildHierarchy = (nodeId, prefix) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = nodesById.get(nodeId);

      text += `${prefix} ${node.data.label}\n`;

      const childEdges = edgesBySource.get(nodeId) || [];
      const sortedChildren = childEdges
        .map((edge) => nodesById.get(edge.target))
        .filter(Boolean)
        .sort((a, b) => a.position.y - b.position.y);

      sortedChildren.forEach((childNode, index) => {
        buildHierarchy(childNode.id, `${prefix}.${index + 1}`);
      });
    };

    rootNodes.forEach((rootNode, index) => {
      buildHierarchy(rootNode.id, `${index + 1}`);
    });

    setExportText(text);
    setIsExportModalOpen(true);
  }, [activeMindmap]);

  const onAddTab = () => {
    const newMindmapId = mindmapIdCounter++;
    const rootNode = createNewNode('핵심 주제', 'root-node');
    const newMindmap = {
      id: newMindmapId,
      name: `마인드맵 ${newMindmapId}`,
      nodes: [rootNode],
      edges: [],
    };
    setMindmaps([...mindmaps, newMindmap]);
    setActiveMindmapId(newMindmap.id);
  };

  const onCloseTab = (id) => {
    if (mindmaps.length === 1) {
      return; // Don't close the last tab
    }
    setMindmaps(mindmaps.filter((m) => m.id !== id));
    if (activeMindmapId === id) {
      setActiveMindmapId(mindmaps[0].id);
    }
  };

  const nodesWithCallbacks = activeMindmap.nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onAddNode,
      onLabelChange,
      onDeleteNode,
      onColorChange,
      onStartConnection,
      onCompleteConnection,
      onEndConnection,
      onHandleMouseEnter,
      onToggleConnectionMode,
      onConnectFromHandle,
      isConnecting: false, // 오래된 코드 비활성화
      isSelected: selectedNodes.includes(node.id),
      connectionMode: connectionMode,
      canDrag: !connectionMode,
    }
  }));

  // 노드의 깊이(레벨)를 계산하는 함수
  const getNodeDepth = (nodeId, nodes, edges) => {
    // 루트 노드 찾기 (어떤 노드로부터도 연결되지 않은 노드)
    const targetNodes = new Set(edges.map(e => e.target));
    const rootNodes = nodes.filter(n => !targetNodes.has(n.id));
    
    if (rootNodes.some(r => r.id === nodeId)) {
      return 0; // 루트 노드
    }
    
    // BFS로 깊이 계산
    const queue = [...rootNodes.map(n => ({ id: n.id, depth: 0 }))];
    const visited = new Set();
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      
      if (id === nodeId) {
        return depth;
      }
      
      if (visited.has(id)) continue;
      visited.add(id);
      
      // 자식 노드들 찾기
      const childEdges = edges.filter(e => e.source === id);
      for (const edge of childEdges) {
        if (!visited.has(edge.target)) {
          queue.push({ id: edge.target, depth: depth + 1 });
        }
      }
    }
    
    return 1; // 기본값
  };

  // 연결선들에 기본 스타일 적용
  const edgesWithStyles = activeMindmap.edges.map(edge => {
    // 점선 연결선은 그대로 유지
    if (edge.className === 'dashed-edge') {
      return edge;
    }
    
    const sourceNode = activeMindmap.nodes.find(n => n.id === edge.source);
    const targetNode = activeMindmap.nodes.find(n => n.id === edge.target);
    
    let sourceColor = '#1a192b';
    let strokeWidth = 2;
    let className = '';
    
    // 소스 노드의 깊이 계산
    const sourceDepth = getNodeDepth(edge.source, activeMindmap.nodes, activeMindmap.edges);
    
    if (sourceNode?.className === 'root-node') {
      // 루트 노드에서 직접 연결 (가장 두꺼움)
      sourceColor = '#B8D4F0';
      strokeWidth = edge.className === 'highlighted-edge' ? 7 : 6;
      className = edge.className === 'highlighted-edge' ? 'root-edge highlighted-edge' : 'root-edge';
    } else if (sourceDepth === 1) {
      // 1단계 노드에서 연결 (중간 두께)
      sourceColor = sourceNode?.data?.color ? getDarkerColor(sourceNode.data.color) : '#1a192b';
      strokeWidth = edge.className === 'highlighted-edge' ? 3 : 2.5;
      className = edge.className === 'highlighted-edge' ? 'level1-edge highlighted-edge' : 'level1-edge';
    } else {
      // 2단계 이상 노드에서 연결 (얇음)
      sourceColor = sourceNode?.data?.color ? getDarkerColor(sourceNode.data.color) : '#1a192b';
      strokeWidth = edge.className === 'highlighted-edge' ? 2 : 1.5;
      className = edge.className === 'highlighted-edge' ? 'level2-edge highlighted-edge' : 'level2-edge';
    }
    
    return {
      ...edge,
      style: {
        stroke: sourceColor,
        strokeWidth: strokeWidth,
        ...edge.style,
      },
      className: className || edge.className,
    };
  });

  return (
    <div className="main-container">
      <Tabs
        mindmaps={mindmaps}
        activeMindmapId={activeMindmapId}
        onTabClick={setActiveMindmapId}
        onAddTab={onAddTab}
        onCloseTab={onCloseTab}
      />
      <div className="toolbar">
        <button className="btn btn-secondary" onClick={onSave}>
          저장
        </button>
        <button
          className="btn btn-secondary ms-2"
          onClick={onLoadFromFileClick}
        >
          파일로 불러오기
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".json"
        />
        <button
          className="btn btn-secondary ms-2"
          onClick={() => setIsLoadModalOpen(true)}
        >
          텍스트로 불러오기
        </button>
        <button className="btn btn-secondary ms-2" onClick={onExport}>
          텍스트로 내보내기
        </button>
      </div>
      <div className="reactflow-wrapper">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodesWithCallbacks}
            edges={edgesWithStyles}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeDragStart={onNodeDragStart}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onEdgeContextMenu={onEdgeContextMenu}
            fitView
          />
        </ReactFlowProvider>
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsExportModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>텍스트로 내보내기</h3>
            <textarea
              value={exportText}
              readOnly
              className="form-control"
              rows="10"
            />
            <div className="mt-3 text-end">
              <button
                className="btn btn-primary"
                onClick={() => {
                  navigator.clipboard.writeText(exportText);
                  alert('텍스트가 클립보드에 복사되었습니다.');
                }}
              >
                클립보드에 복사
              </button>
              <button
                className="btn btn-secondary ms-2"
                onClick={() => setIsExportModalOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load from Text Modal */}
      {isLoadModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsLoadModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>텍스트로 불러오기</h3>
            <p>JSON 또는 번호 형식의 텍스트를 붙여넣거나 파일을 선택하세요.</p>
            
            {/* 파일 선택 섹션 */}
            <div className="mb-3">
              <label htmlFor="file-input" className="form-label">
                파일에서 불러오기:
              </label>
              <input
                type="file"
                id="file-input"
                accept=".json,.txt"
                onChange={handleFileSelect}
                className="form-control"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => {
                  console.log('파일 선택 버튼 클릭됨!');
                  const fileInput = document.getElementById('file-input');
                  console.log('파일 입력 요소 찾기:', fileInput);
                  if (fileInput) {
                    console.log('파일 입력 클릭 실행');
                    fileInput.click();
                  } else {
                    console.error('파일 입력 요소를 찾을 수 없음!');
                    alert('파일 입력 요소를 찾을 수 없습니다.');
                  }
                }}
              >
                📁 파일 선택
              </button>
              <small className="form-text text-muted ms-2">
                .json 또는 .txt 파일을 선택하면 바로 마인드맵으로 로드됩니다
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label">또는 직접 입력:</label>
              <textarea
                className="form-control"
                rows="10"
                value={loadJsonText}
                onChange={(e) => setLoadJsonText(e.target.value)}
                placeholder="1. 주제1\n1.1. 하위 주제1\n..."
              />
            </div>

            <div className="mt-3 text-end">
              <button
                className="btn btn-primary"
                onClick={handleLoadFromText}
              >
                불러오기
              </button>
              <button
                className="btn btn-secondary ms-2"
                onClick={() => setIsLoadModalOpen(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

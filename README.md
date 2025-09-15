# Mindmap App

A beautiful and interactive mind mapping application built with React and Vite.

## Features

- Interactive mind map creation and editing
- Node color customization with 10 beautiful pastel colors
- Add/delete nodes with intuitive controls
- Save and load mind maps as JSON files
- Export mind maps as structured text
- Multiple tabs support for different mind maps

## Quick Start

### Windows
```bash
start.bat
```

### macOS/Linux
```bash
chmod +x start.sh
./start.sh
```

### Universal (Cross-platform)
```bash
node start-universal.js
```

### Manual Setup
```bash
npm install
npm run dev
```

## Usage

1. **Creating Nodes**: Click the "+" buttons around a node to add new connected nodes
2. **Editing Text**: Double-click on any node to edit its text
3. **Changing Colors**: Hover over a node and click the 🎨 button to change its color
4. **Deleting Nodes**: Hover over a node and click the "-" button to delete it
5. **Saving**: Use the "저장" button to save your mind map as a JSON file
6. **Loading**: Use "파일로 불러오기" or "텍스트로 불러오기" to load existing mind maps

## Color Palette

The app includes 10 beautiful pastel colors:
- Light Pink (#FFE5E5)
- Light Rose (#FFE5F1)
- Light Lavender (#F0E5FF)
- Light Blue (#E5E5FF)
- Light Sky Blue (#E5F0FF)
- Light Mint (#E5FFE5)
- Light Lime (#F0FFE5)
- Light Yellow (#FFFFE5)
- Light Peach (#FFE5CC)
- Light Coral (#FFCCE5)

## Technology Stack

- React 18
- Vite
- ReactFlow
- CSS3

## Development

This project uses Vite for fast development and hot module replacement (HMR).

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# File Info Viewer - VS Code Extension

A lightweight VS Code extension that displays detailed file information in a custom editor view.

## Features

- View comprehensive file metadata including:
  - File name and type
  - Full path and directory
  - File size (auto-formatted)
  - Creation and modification dates
- One-click copy for any file property
- Quick navigation to file directory
- Open file with default application

## Installation

1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "File Info Viewer"
4. Click Install button

## Usage

### Recommended Configuration

1. Open VS Code Settings (JSON)
2. Add file type associations in `workbench.editorAssociations`:

```json
"workbench.editorAssociations": {
  //...
  "*.zip": "file-info-viewer.fileInfoViewer",
  "*.docx": "file-info-viewer.fileInfoViewer",
}
```

3. Replace `*.zip` and `*.docx` with the file types you want to view

### Screenshots

![File Info Viewer](https://github.com/wxmvv/file-info-viewer/blob/main/Xnip2025-07-11_21-02-46.png?raw=true)

## Technical Details

- Built with TypeScript
- Uses VS Code Webview API
- Lightweight (~100KB installed size)
- No external dependencies

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://github.com/wxmvv/file-info-viewer/blob/main/LICENSE)

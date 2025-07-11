import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface FileInfo {
	path: string;
	name: string;
	type: string;
	directory: string;
	size: number;
	createdAt: Date;
	modifiedAt: Date;
}

class FileInfoViewerProvider implements vscode.CustomReadonlyEditorProvider {
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new FileInfoViewerProvider(context);
		// const config = vscode.workspace.getConfiguration('fileInfoViewer');
		// const matchAllFiles = config.get<boolean>('matchAllFiles', true);
        
        // if (matchAllFiles) {
            // customEditors will be registered for all file types
            
        // }
		return vscode.window.registerCustomEditorProvider(
			"file-info-viewer.fileInfoViewer",
			provider,
			{
				supportsMultipleEditorsPerDocument: false,
				webviewOptions: {
					retainContextWhenHidden: true,
				},
			},
		);
	}

	constructor(private readonly context: vscode.ExtensionContext) {}

	public async openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): Promise<vscode.CustomDocument> {
		return {
			uri,
			dispose: () => {},
		};
	}

	public async resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
		const filePath = document.uri.fsPath;
		const fileInfo = this.getFileInfo(filePath);

		webviewPanel.webview.options = {
			enableScripts: true,
		};

		webviewPanel.webview.html = this.getWebviewContent(fileInfo);

		webviewPanel.webview.onDidReceiveMessage((message) => this.handleWebviewMessage(message), undefined, this.context.subscriptions);
	}

	private getFileInfo(filePath: string): FileInfo | null {
		try {
			if (!fs.existsSync(filePath)) {
				return null;
			}
			const stats = fs.statSync(filePath);
			const parsedPath = path.parse(filePath);
			return {
				path: filePath,
				name: parsedPath.base,
				type: parsedPath.ext ? parsedPath.ext.slice(1) : "Directory",
				directory: parsedPath.dir,
				size: stats.size,
				createdAt: stats.birthtime,
				modifiedAt: stats.mtime,
			};
		} catch (error) {
			console.error(`Failed to get file info for ${filePath}:`, error);
			return null;
		}
	}

	private getWebviewContent(fileInfo: FileInfo | null): string {
		if (!fileInfo) {
			return `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
    <h1>无法获取文件信息</h1>
</body>
</html>`;
		}

		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Info Viewer</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { position: relative; border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f220; }
        .copy-btn {
            margin-left: 8px;
            padding: 2px 6px;
            background: #f2f2f210;
            color: white;
            border: none;
            border-radius: 2px;
            cursor: pointer;
            position: absolute;
            top: 8px;
            right: 8px;
            z-index: 2;
            opacity: 0;
        }
        tr:hover .copy-btn {
            opacity: 1;
        }
        .copy-btn:hover {
            background: #f2f2f240;
        }
        .dir-link {
            color: #0078d4;
            text-decoration: underline;
            cursor: pointer;
        }
        .open-btn {
            display: block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #0078d4;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
        }
        .open-btn:hover {
            background: #106ebe;
        }
    </style>
</head>
<body>
    <h1>File Information</h1>
    <table>
        <tr><th>Property</th><th>Value</th></tr>
        <tr><td>Name</td><td>${fileInfo.name} <button class="copy-btn" onclick="copyToClipboard('${fileInfo.name}')">Copy</button></td></tr>
        <tr><td>Type</td><td>${fileInfo.type} <button class="copy-btn" onclick="copyToClipboard('${fileInfo.type}')">Copy</button></td></tr>
        <tr><td>Directory</td><td><span class="dir-link" onclick="openDirectory('${fileInfo.directory}')">${fileInfo.directory}</span> <button class="copy-btn" onclick="copyToClipboard('${fileInfo.directory}')">Copy</button></td></tr>
        <tr><td>Path</td><td>${fileInfo.path} <button class="copy-btn" onclick="copyToClipboard('${fileInfo.path}')">Copy</button></td></tr>
        <tr><td>Size</td><td>${this.formatFileSize(fileInfo.size)} <button class="copy-btn" onclick="copyToClipboard('${this.formatFileSize(fileInfo.size)}')">Copy</button></td></tr>
        <tr><td>Created</td><td>${fileInfo.createdAt.toLocaleString()} <button class="copy-btn" onclick="copyToClipboard('${fileInfo.createdAt.toLocaleString()}')">Copy</button></td></tr>
        <tr><td>Modified</td><td>${fileInfo.modifiedAt.toLocaleString()} <button class="copy-btn" onclick="copyToClipboard('${fileInfo.modifiedAt.toLocaleString()}')">Copy</button></td></tr>
    </table>
    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                vscode.postMessage({
                    command: 'showInfo',
                    text: 'Copied to clipboard'
                });
            });
        }
        function openDirectory(path) {
            vscode.postMessage({
                command: 'openDirectory',
                path: path
            });
        }
        const vscode = acquireVsCodeApi();
    </script>
    <button class="open-btn" onclick="openWithDefaultApp()">Open With Default App</button>
    <script>
        function openWithDefaultApp() {
            vscode.postMessage({
                command: 'openWithDefaultApp',
                path: '${fileInfo.path}'
            });
        }
    </script>
</body>
</html>`;
	}

	private formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
		if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	}

	private handleWebviewMessage(message: any) {
		switch (message.command) {
			case "openDirectory":
				vscode.env.openExternal(vscode.Uri.file(message.path));
				break;
			case "showInfo":
				vscode.window.showInformationMessage(message.text);
				break;
			case "openWithDefaultApp":
				vscode.env.openExternal(vscode.Uri.file(message.path));
				break;
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	// Register custom editor provider
	context.subscriptions.push(FileInfoViewerProvider.register(context));
}

export function deactivate() {}

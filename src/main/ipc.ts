import { ipcMain, dialog, IpcMainEvent } from "electron";

import { IPCRequests, IPCResponses } from "../shared/ipc";
import { WindowController, IWindowDefinition } from "./window";
import { Settings } from "./settings";
import EditorApp from "./main";

export class IPC {
	/**
	 * Constructor.
	 */
	public constructor() {
		ipcMain.on(IPCRequests.StartDebugGame, IPC.OnStartDebugGame);
		ipcMain.on(IPCRequests.OpenFileDialog, IPC.OnOpenFileDialog);
		ipcMain.on(IPCRequests.GetProjectPath, IPC.OnGetProjectPath);
		ipcMain.on(IPCRequests.SetProjectPath, IPC.OnSetProjectPath);
		ipcMain.on(IPCRequests.GetWorkspacePath, IPC.OnGetWorkspacePath);
	}

	/**
	 * Starts debugging the game.
	 */
	public static async OnStartDebugGame(event: IpcMainEvent, definition: IWindowDefinition): Promise<void> {
		const window = await WindowController.WindowOnDemand(definition);
		window.webContents.send(IPCRequests.StartDebugGame);
		event.sender.send(IPCResponses.StartDebugGame, window.id);
	}

	/**
	 * The user wants to show the open file dialog.
	 */
	public static async OnOpenFileDialog(event: IpcMainEvent, title: string, defaultPath: string): Promise<void> {
		const result = await dialog.showOpenDialog(EditorApp.Window, { title, defaultPath, properties: ["openDirectory"] });

		if (!result || !result.filePaths.length) { return event.sender.send(IPCResponses.CancelOpenFileDialog); }
		event.sender.send(IPCResponses.OpenFileDialog, result.filePaths[0]);
	}

	/**
	 * The user wants to know what is the opened project file from the OS file explorer.
	 */
	public static OnGetProjectPath(event: IpcMainEvent): void {
		event.sender.send(IPCResponses.GetProjectPath, Settings.OpenedFile);
	}

	/**
	 * The user wants to set the new project path.
	 */
	public static OnSetProjectPath(event: IpcMainEvent, path: string): void {
		Settings.OpenedFile = path;
		event.sender.send(IPCResponses.SetProjectPath);
	}

	/**
	 * The user wants to know what is the opened project file from the OS file explorer.
	 */
	public static OnGetWorkspacePath(event: IpcMainEvent): void {
		event.sender.send(IPCResponses.GetWorkspacePath, Settings.WorkspacePath);
	}
}

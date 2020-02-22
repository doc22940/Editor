export enum IPCRequests {
	StartDebugGame = "requeststartdebuggame",
	OpenFileDialog = "openfiledialog",
	GetProjectPath = "getprojectpath",
	SetProjectPath = "setprojectpath",
	GetWorkspacePath = "getworkspacepath",
}

export enum IPCResponses {
	StartDebugGame = "responsestartdebuggame",
	CancelOpenFileDialog = "cancelopenfiledialog",
	OpenFileDialog = "openfiledialog",
	GetProjectPath = "getprojectpath",
	SetProjectPath = "setprojectpath",
	GetWorkspacePath = "getworkspacepath",
}

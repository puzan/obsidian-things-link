import {
	Editor,
	EditorPosition,
	MarkdownView,
	Plugin,
	parseFrontMatterAliases,
} from "obsidian";
import {
	ThingsSettingTab,
	ThingsSettings,
	DEFAULT_SETTINGS,
	LinkPlace,
	ProjectTitleSource,
} from "settings";
import { Notice } from "obsidian";

function getCurrentLine(editor: Editor, view: MarkdownView) {
	const lineNumber = editor.getCursor().line;
	const lineText = editor.getLine(lineNumber);
	return lineText;
}

function prepareTask(line: string) {
	line = line.trim();
	//remove all leading non-alphanumeric characters
	line = line.replace(/^\W+|\W+$/, "");
	line = urlEncode(line);
	return line;
}

function urlEncode(line: string) {
	line = encodeURIComponent(line);
	return line;
}

function createProject(title: string, deepLink: string) {
	const project = `things:///add-project?title=${title}&notes=${deepLink}&x-success=obsidian://project-id`;
	window.open(project);
}

function createTask(line: string, deepLink: string) {
	const task = `things:///add?title=${line}&notes=${deepLink}&x-success=obsidian://task-id`;
	window.open(task);
}

function getProjectTitle(view: MarkdownView, settings: ThingsSettings): string {
	const file = view.file;
	if (!file) return "";

	for (const source of settings.projectTitleSources) {
		let title = "";
		switch (source) {
			case ProjectTitleSource.FIRST_H1: {
				const content = view.editor.getValue();
				const h1Match = content.match(/^# (.*)$/m);
				if (h1Match) {
					title = h1Match[1];
					break;
				}
				break;
			}
			case ProjectTitleSource.FIRST_ALIAS: {
				const metadata = view.app.metadataCache.getFileCache(file);
				if (metadata) {
					const aliases = parseFrontMatterAliases(metadata);
					if (aliases && aliases.length > 0) {
						title = aliases[0];
						break;
					}
				}
				break;
			}
			case ProjectTitleSource.FILE_NAME: {
				title = file.name.replace(/\.md$/, "");
				break;
			}
		}
		if (title) {
			return title;
		}
	}

	// Fallback to file name if no other source provided a title
	return file.name.replace(/\.md$/, "");
}

function hasProjectLink(view: MarkdownView, settings: ThingsSettings): boolean {
	const file = view.file;
	if (!file) return false;

	switch (settings.linkPlace) {
		case LinkPlace.PROPERTY: {
			// Check for link in frontmatter
			const metadata = view.app.metadataCache.getFileCache(file);
			if (metadata?.frontmatter?.things) {
				return true;
			}
			break;
		}
		case LinkPlace.FIRST_HEADING: {
			// Check for link after heading
			const content = view.editor.getValue();
			const lines = content.split("\n");
			const h1Index = lines.findIndex((line) => line.startsWith("# "));
			if (h1Index !== -1 && h1Index + 2 < lines.length) {
				const linkLine = lines[h1Index + 2];
				if (linkLine.includes("things:///show?id=")) {
					return true;
				}
			}
			break;
		}
		default:
			console.log("Unsupported LinkPlace setting");
	}

	return false;
}

export default class ThingsLink extends Plugin {
	settings: ThingsSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new ThingsSettingTab(this.app, this));

		this.registerObsidianProtocolHandler("project-id", async (id) => {
			const projectID = id["x-things-id"];
			const workspace = this.app.workspace;
			const view = workspace.getActiveViewOfType(MarkdownView);

			if (view == null) {
				return;
			}

			const thingsDeepLink = `things:///show?id=${projectID}`;

			switch (this.settings.linkPlace) {
				case LinkPlace.FIRST_HEADING: {
					const editor = view.editor;
					const fileText = editor.getValue();
					const lines = fileText.split("\n");
					const h1Index = lines.findIndex((line) =>
						line.startsWith("#"),
					);
					if (h1Index !== -1) {
						const startRange: EditorPosition = {
							line: h1Index,
							ch: lines[h1Index].length,
						};
						const endRange: EditorPosition = {
							line: h1Index,
							ch: lines[h1Index].length,
						};
						editor.replaceRange(
							`\n\n[Things](${thingsDeepLink})`,
							startRange,
							endRange,
						);
					} else {
						const startRange: EditorPosition = {
							line: 0,
							ch: 0,
						};
						const endRange: EditorPosition = {
							line: 0,
							ch: 0,
						};
						editor.replaceRange(
							`[Things](${thingsDeepLink})\n\n`,
							startRange,
							endRange,
						);
					}
					break;
				}

				case LinkPlace.PROPERTY: {
					await this.app.fileManager.processFrontMatter(
						workspace.getActiveFile(),
						(frontmatter) => {
							frontmatter["things"] = thingsDeepLink;
						},
					);
					break;
				}

				default:
					console.log("Unsupported LinkPlace setting");
			}
		});

		this.addCommand({
			id: "create-things-project",
			name: "Create Things Project",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const workspace = this.app.workspace;
				const fileTitle = workspace.getActiveFile();
				if (fileTitle == null) {
					return;
				}
				if (hasProjectLink(view, this.settings)) {
					new Notice("Project link already exists in this note");
					return;
				}
				const title = getProjectTitle(view, this.settings);
				const fileName = urlEncode(title);
				const obsidianDeepLink = (this.app as any).getObsidianUrl(
					fileTitle,
				);
				const encodedLink = urlEncode(obsidianDeepLink);
				createProject(fileName, encodedLink);
			},
		});

		this.registerObsidianProtocolHandler("task-id", async (id) => {
			const taskID = id["x-things-id"];
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view == null) {
				return;
			} else {
				const editor = view.editor;
				const currentLine = getCurrentLine(editor, view);
				const firstLetterIndex = currentLine.search(/[a-zA-Z]|[0-9]/);
				const line = currentLine.substring(
					firstLetterIndex,
					currentLine.length,
				);
				const editorPosition = view.editor.getCursor();
				const lineLength = view.editor.getLine(
					editorPosition.line,
				).length;
				const startRange: EditorPosition = {
					line: editorPosition.line,
					ch: firstLetterIndex,
				};
				const endRange: EditorPosition = {
					line: editorPosition.line,
					ch: lineLength,
				};
				view.editor.replaceRange(
					`[${line}](things:///show?id=${taskID})`,
					startRange,
					endRange,
				);
			}
		});

		this.addCommand({
			id: "create-things-task",
			name: "Create Things Task",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const workspace = this.app.workspace;
				const fileTitle = workspace.getActiveFile();
				if (fileTitle == null) {
					return;
				} else {
					const obsidianDeepLink = (this.app as any).getObsidianUrl(
						fileTitle,
					);
					const encodedLink = urlEncode(obsidianDeepLink);
					const line = getCurrentLine(editor, view);
					const task = prepareTask(line);
					createTask(task, encodedLink);
				}
			},
		});
	}
	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

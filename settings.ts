import ThingsLink from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

export enum LinkPlace {
	FIRST_HEADING = "first_heading",
	PROPERTY = "property",
}

export enum ProjectTitleSource {
	FIRST_H1 = "first_h1",
	FIRST_ALIAS = "first_alias",
	FILE_NAME = "file_name",
}

export interface ThingsSettings {
	linkPlace: LinkPlace;
	projectTitleSources: ProjectTitleSource[];
}

export const DEFAULT_SETTINGS: Partial<ThingsSettings> = {
	linkPlace: LinkPlace.FIRST_HEADING,
	projectTitleSources: [ProjectTitleSource.FILE_NAME],
};

export class ThingsSettingTab extends PluginSettingTab {
	plugin: ThingsLink;

	constructor(app: App, plugin: ThingsLink) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h3", { text: "Base Settings" });
		new Setting(containerEl)
			.setName("Link place")
			.setDesc("Where to add things link")
			.addDropdown((component) =>
				component
					.addOption(LinkPlace.FIRST_HEADING, "after first heading")
					.addOption(LinkPlace.PROPERTY, 'in "things" property')
					.setValue(this.plugin.settings.linkPlace)
					.onChange(async (value) => {
						this.plugin.settings.linkPlace = value as LinkPlace;
						await this.plugin.saveSettings();
					}),
			);

		containerEl.createEl("h3", { text: "Project Title Sources" });

		const sourcesContainer = containerEl.createDiv();
		sourcesContainer.createEl("p", {
			text: "Configure the order of sources used to determine the project title in Things. The first available source from the list will be used. If no sources are available, the file name will be used as a fallback.",
		});
		sourcesContainer.createEl("p", {
			text: "Available sources:",
			attr: { style: "margin-top: 8px; font-weight: bold;" },
		});
		sourcesContainer
			.createEl("ul", {
				text: "",
				attr: { style: "margin: 4px 0 16px 0; padding-left: 20px;" },
			})
			.createEl("li", {
				text: "First H1 Heading - Uses the first heading of level 1 (#) in the document",
			})
			.createEl("li", {
				text: "First Alias - Uses the first alias from the document's frontmatter",
			})
			.createEl("li", {
				text: "File Name - Uses the document's filename (without .md extension)",
			});

		const list = sourcesContainer.createEl("ul", {
			cls: "project-title-sources-list",
		});
		list.style.listStyle = "none";
		list.style.padding = "0";

		const sources = [...this.plugin.settings.projectTitleSources];

		sources.forEach((source) => {
			const li = list.createEl("li");
			li.style.display = "flex";
			li.style.alignItems = "center";
			li.style.marginBottom = "8px";
			li.style.padding = "8px";
			li.style.backgroundColor = "var(--background-secondary)";
			li.style.borderRadius = "4px";
			li.style.cursor = "move";

			li.createEl("span", {
				text: this.getSourceDisplayName(source),
				attr: { style: "flex: 1" },
			});

			const removeButton = li.createEl("button", {
				text: "Remove",
				cls: "mod-warning",
			});
			removeButton.onclick = () => {
				const index = sources.indexOf(source);
				if (index > -1) {
					sources.splice(index, 1);
					this.plugin.settings.projectTitleSources = sources;
					this.plugin.saveSettings();
					this.display();
				}
			};

			// Add drag and drop functionality
			li.draggable = true;
			li.ondragstart = (e: DragEvent) => {
				e.dataTransfer?.setData("text/plain", source);
				li.classList.add("dragging");
			};
			li.ondragend = () => {
				li.classList.remove("dragging");
			};
			li.ondragover = (e: DragEvent) => {
				e.preventDefault();
				const dragging = document.querySelector(".dragging");
				if (dragging) {
					const rect = li.getBoundingClientRect();
					const midY = rect.top + rect.height / 2;
					if (e.clientY < midY) {
						li.parentNode?.insertBefore(dragging, li);
					} else {
						li.parentNode?.insertBefore(dragging, li.nextSibling);
					}
				}
			};
			li.ondrop = (e: DragEvent) => {
				e.preventDefault();
				const source = e.dataTransfer?.getData("text/plain");
				if (source) {
					const oldIndex = sources.indexOf(
						source as ProjectTitleSource,
					);
					const newIndex = Array.from(list.children).indexOf(li);
					sources.splice(oldIndex, 1);
					sources.splice(newIndex, 0, source as ProjectTitleSource);
					this.plugin.settings.projectTitleSources = sources;
					this.plugin.saveSettings();
					this.display();
				}
			};
		});

		const addSourceContainer = sourcesContainer.createDiv();
		addSourceContainer.style.marginTop = "16px";

		const availableSources = Object.values(ProjectTitleSource).filter(
			(source) => !sources.includes(source),
		);

		if (availableSources.length > 0) {
			const dropdown = addSourceContainer.createEl("select");
			availableSources.forEach((source) => {
				dropdown.createEl("option", {
					value: source,
					text: this.getSourceDisplayName(source),
				});
			});

			const addButton = addSourceContainer.createEl("button", {
				text: "Add Source",
			});
			addButton.onclick = () => {
				const selectedSource = dropdown.value as ProjectTitleSource;
				sources.push(selectedSource);
				this.plugin.settings.projectTitleSources = sources;
				this.plugin.saveSettings();
				this.display();
			};
		}
	}

	getSourceDisplayName(source: ProjectTitleSource): string {
		switch (source) {
			case ProjectTitleSource.FIRST_H1:
				return "First H1 Heading";
			case ProjectTitleSource.FIRST_ALIAS:
				return "First Alias";
			case ProjectTitleSource.FILE_NAME:
				return "File Name";
			default:
				return source;
		}
	}
}

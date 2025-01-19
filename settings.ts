import ThingsLink from './main';
import { App, PluginSettingTab, Setting } from 'obsidian';

export enum LinkPlace {
	FIRST_HEADING = "first_heading",
	PROPERTY = "property"
}

export interface ThingsSettings {
	linkPlace: LinkPlace
}

export const DEFAULT_SETTINGS: Partial<ThingsSettings> = {
	linkPlace: LinkPlace.FIRST_HEADING
}

export class ThingsSettingTab extends PluginSettingTab {
	plugin: ThingsLink;

	constructor(app: App, plugin: ThingsLink) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Link place')
			.setDesc('Where to add things link')
			.addDropdown((component) => 
				component
					.addOption(LinkPlace.FIRST_HEADING, "after first heading")
					.addOption(LinkPlace.PROPERTY, "in \"things\" property")
					.setValue(this.plugin.settings.linkPlace)
					.onChange(async (value) => {
						this.plugin.settings.linkPlace = value as LinkPlace;
						await this.plugin.saveSettings();
					})
			);
	}
}

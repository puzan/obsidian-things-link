# Things Link

Seamlessly create [Things](https://culturedcode.com/things/) tasks and projects from Obsidian.
<img width="1711" alt="thingslink" src="https://user-images.githubusercontent.com/59900904/156386765-3a5923e2-0f05-4268-952d-f971c43f3aee.png">

## Installation

### Using BRAT (Recommended)

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. Open BRAT settings
3. Add this repository: `puzan/obsidian-things-link`
4. Click "Add Plugin"
5. Enable the plugin in Obsidian settings

### Manual Installation

1. Download the latest release from the releases page
2. Extract the files into your vault's plugins folder: `<vault>/.obsidian/plugins/obsidian-id-link-plugin/`
3. Reload Obsidian
4. Enable the plugin in Settings > Community Plugins

## Features

### Project Creation

- Create Things projects directly from Obsidian notes
- Automatic bidirectional linking between Things and Obsidian
- Smart project title selection from multiple sources:
  - First H1 heading in the note
  - First alias from frontmatter
  - Note filename
- Customizable order of title sources
- Link placement options:
  - After first heading
  - In frontmatter as "things" property

### Task Creation

- Create Things tasks from any line in your Obsidian note
- Create tasks from selected text
- Automatic bidirectional linking between tasks and notes
- Tasks are created in Things Inbox for easy organization
- Preserves original line content as task title
- Automatically creates markdown links to tasks in your note
- Smart task title extraction:
  - Uses selected text if available
  - Extracts task title from current line if no selection
  - Removes non-alphanumeric characters from task titles

### Link Types

- Two types of links supported for bidirectional linking:
  - Standard Obsidian links (default)
  - ID-based links (requires [ID Link](https://github.com/puzan/obsidian-id-link) plugin)
- Automatic fallback to standard Obsidian links if:
  - ID Link plugin is not installed
  - No ID found in the note

### Commands

- `Create Things Project` - Creates a new Things project from the current note
- `Create Things Task` - Creates a new Things task from the current line

## Settings

### Base Settings

- **Link place** - Choose where to add Things links:
  - After first heading
  - In frontmatter as "things" property
- **Link type** - Choose what type of links to use:
  - Obsidian link - Standard Obsidian links
  - ID link - Links based on unique IDs (requires ID Link plugin)

### Project Title Sources

Configure the order of sources used to determine the project title in Things:
- First H1 heading in the note
- First alias from frontmatter
- Note filename

The first available source from the list will be used. If no sources are available, the file name will be used as a fallback.

## Development

This plugin is built using TypeScript and requires Node.js v16 or higher.

To set up the development environment:

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev` to start compilation in watch mode
4. Make changes to `main.ts`
5. Reload Obsidian to test changes

## Releasing

To prepare a new release run command:

```bash
npm run release
```

This will:

- Run ESLint and Prettier to ensure code quality
- Analyze commits since last tag using conventional commits
- Determine version bump type (major/minor/patch) based on commit types:
   - `feat!` or `BREAKING CHANGE:` → major
   - `feat:` → minor
   - `fix:` and others → patch
- Bump version in package.json
- Update manifest.json and versions.json
- Create a git commit with version tag
- Push changes and tags to remote
- Create/update GitHub release with changelog

Note: Make sure your commits follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for automatic version determination to work correctly.

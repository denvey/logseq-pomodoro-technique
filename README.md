## Repository description
This repository is a fork [logseq-plugin-samples/logseq-pomodoro-timer](https://github.com/logseq/logseq-plugin-samples/tree/master/logseq-pomodoro-timer).

I mainly did the adaptation of the new version, fixed the style problem, and added the shortcut keys.
## Pomodoro Technique 

What's it? https://en.wikipedia.org/wiki/Pomodoro_Technique

This is sample that show you how to use slot ui to render block content in part :)

### Demo

![demo](./demo.gif)

### API

[![npm version](https://badge.fury.io/js/%40logseq%2Flibs.svg)](https://badge.fury.io/js/%40logseq%2Flibs)

##### Logseq.App

- `registerSlashCommand: (tag: string, action: BlockCommandCallback | Array<SlashCommandAction>) => boolean`
- `onMacroRendererSlotted: IUserSlotHook<{ payload: { arguments: Array<string>, uuid: string, [key: string]: any } }>`

> ⚠️ The current implementation may have performance issues,
> especially when there are too many running timer instances.
> That's because time ticker needs messaging frequently between
> host and plugin sandbox. We are exploring better solutions for
> the rendering of block content partly.
 
### Running the Sample

 
- `yarn && yarn build` in terminal to install dependencies.
- `Load unpacked plugin` in Logseq Desktop client.

### License
MIT

import '@logseq/libs'
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin'

const settings: SettingSchemaDesc[] = [
  {
    title: "Keybinding for Pomodoro Technique",
    key: "pomodoroTechniqueKeybinding",
    type: "string",
    default: "mod+o",
    description: "Keybinding to open Pomodoro Timer",
  },
  {
    title: "Pomodoro Time Length",
    key: "pomodoroTimeLength",
    type: "number",
    default: 25,
    description: "Set the length of your pomodoro in minutes",
  }
]
logseq.useSettingsSchema(settings);

/**
 * main entry
 */
async function main () {
  const genRandomStr = () => Math.random().
    toString(36).
    replace(/[^a-z]+/g, '').
    substr(0, 5)

  // models
  logseq.provideModel({
    async startPomoTimer (e: any) {
      const { pomoId, slotId, blockUuid,durationMins } = e.dataset
      const startTime = Date.now()
      const block = await logseq.Editor.getBlock(blockUuid)
      const content = block?.content || ""
      if(!content) return

      const regExp = new RegExp(`\\pomodoro_${pomoId}(,\\d+)*`, 'g');

      let findData = content.match(regExp)
      if(!findData) return
      let flag=findData[0]
      let params = flag?.split(",")

      let timestamp = Date.now()
      let newFlag:any;
      switch(params.length){
        case 1:
          newFlag=`${params[0]},${durationMins},${timestamp}`
          break;
        case 2:
          newFlag=`${params[0]},${params[1]},${timestamp}`
          break;
        case 3:
          newFlag=`${params[0]},${params[1]},${params[2]}`
          break;
      }
      
      let newContent = content.replace(flag,newFlag)
      if (!newContent) return

      await logseq.Editor.updateBlock(blockUuid, newContent)
      renderTimer({ pomoId, slotId, startTime})
  
    },
  })

  logseq.provideStyle(`
    .pomodoro-timer-btn {
      border: 1px solid var(--ls-border-color); 
      white-space: initial; 
      padding: 0 4px; 
      font-size: 15px;
      border-radius: 4px; 
      user-select: none;
      cursor: default;
      display: flex;
      align-content: center;
    }
    
    .pomodoro-timer-btn.is-start:hover {
      opacity: .8;
    }
    
    .pomodoro-timer-btn.is-start:active {
      opacity: .6;
    }
    
    .pomodoro-timer-btn.is-start {
      padding: 0 6px;
      cursor: pointer;
    }
    
    .pomodoro-timer-btn.is-pending {
      padding: 0 6px;
      background-color: #f6dbdb;
      border-color: #edbdbd;
      font-family: Helvetica,Times New Roman,Microsoft Yahei;
      color: #cd3838;
    }
    
    .pomodoro-timer-btn.is-done {
      width: auto;
      background-color: #defcf0;
      border-color: #9ddbc7;
      color: #0F9960;
    }
  `)

  // entries
  logseq.Editor.registerSlashCommand('🍅 Pomodoro Technique', async () => {
    const durationMins = logseq.settings?.pomodoroTimeLength || 25
    await logseq.Editor.insertAtEditingCursor(
      `{{renderer :pomodoro_${genRandomStr()},${durationMins}}} `,
    )
  })

  // CommandShortcut
  logseq.App.registerCommandShortcut(
    { binding: logseq.settings?.pomodoroTechniqueKeybinding || "alt+o" },
    async () => {
      const durationMins = logseq.settings?.pomodoroTimeLength || 25
      await logseq.Editor.insertAtEditingCursor(
        `{{renderer :pomodoro_${genRandomStr()},${durationMins}}} `,
      )
    }
  )

  /**
   * @param pomoId
   * @param slotId
   * @param startTime
   * @param durationMins
   */
  function renderTimer ({
    pomoId, slotId,
    startTime, durationMins,
  }: any) {
    if (!startTime) return
    const durationTime = (durationMins || logseq.settings?.pomodoroTimeLength || 25) * 60 // default 20 minus
    const keepKey = `${logseq.baseInfo.id}--${pomoId}` // -${slotId}
    // const keepOrNot = () => logseq.App.queryElementById(keepKey)
    
    const provideUi = (isDone: boolean, time: string) => {
      logseq.provideUI({
        key: pomoId,
        slot: slotId,
        reset: true,
        template: `
        ${!isDone ?
          `<a class="pomodoro-timer-btn is-pending">🍅 ${time}</a>` :
          `<a class="pomodoro-timer-btn is-done">🍅 ✅</a>`
        }
      `,
      })
    }

    function _render (init: boolean) {
      const nowTime = Date.now()
      const offsetTime = Math.floor((nowTime - startTime) / 1000)
      const isDone = durationTime < offsetTime
      const humanTime = () => {
        const offset = durationTime - offsetTime
        const minus = Math.floor(offset / 60)
        const secs = offset % 60
        return `${(minus < 10 ? '0' : '') + minus}:${(secs < 10 ? '0' : '') + secs}`
      }
      if(!init && isDone){
        logseq.UI.showMsg("A 🍅 is Done")
      }
      const provideUi = (isDone: boolean, time: string) => {
        logseq.provideUI({
          key: pomoId,
          slot: slotId,
          reset: true,
          template: `
          ${!isDone ?
            `<a class="pomodoro-timer-btn is-pending">🍅 ${time}</a>` :
            `<a class="pomodoro-timer-btn is-done">🍅 ✅</a>`
          }
        `,
        })
      }
      Promise.resolve(init || logseq.UI.queryElementById(keepKey)).then((res) => {
        if (res) {
          provideUi(isDone, humanTime())
          !isDone && setTimeout(() => {
            _render(false)
          }, 1000)
        }
      })
    }

    _render(true)
  }

  logseq.App.onMacroRendererSlotted(({ slot, payload }) => {
    let [type,durationMins, startTime] = payload.arguments
    if (!type?.startsWith(':pomodoro_')) return
    const identity = type.split('_')[1]?.trim()
    if (!identity) return
    if (!durationMins){
      durationMins = durationMins || logseq.settings?.pomodoroTimeLength || 25
    }
    const pomoId = 'pomodoro-timer-start_' + identity
    if (!startTime?.trim()) {
      return logseq.provideUI({
        key: pomoId,
        slot, reset: true,
        template: `
          <button
          class="pomodoro-timer-btn is-start"
          data-slot-id="${slot}" 
          data-pomo-id="${identity}"
          data-block-uuid="${payload.uuid}"
          data-duration-mins="${durationMins}"
          data-on-click="startPomoTimer">
          🍅 START
          </button>
        `,
      })
    }

    // reset slot ui
    renderTimer({ pomoId, slotId: slot, startTime, durationMins })
  })

}

// bootstrap
logseq.ready(main).catch(console.error)

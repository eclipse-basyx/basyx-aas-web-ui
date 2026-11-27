// CSS heights of the EDC module, all derived from the viewport height

// Full height - header - tabs - footer - border
const tabHeight = '100vh - 64px - 48px - 40px - 2px'
// Tab height - padding
const mainHeight = `${tabHeight} - 32px`
// JSON title + padding
const jsonHeaderHeight = '64px + 32px'
// Buttons below a JSON preview
const actionsHeight = '44px'

export const EDC_TAB_HEIGHT = `calc(${tabHeight})`
// Tab height - one row of fields above the list (search) - border
export const EDC_LIST_HEIGHT = `calc(${tabHeight} - 64px - 1px)`
// Tab height - two rows of fields above the list (search or Business Partner, and filter) - border
export const EDC_FILTERED_LIST_HEIGHT = `calc(${tabHeight} - 112px - 1px)`
export const EDC_MAIN_HEIGHT = `calc(${mainHeight})`
export const EDC_JSON_PREVIEW_HEIGHT = `calc(${mainHeight} - (${jsonHeaderHeight}))`
export const EDC_JSON_PREVIEW_WITH_ACTIONS_HEIGHT = `calc(${mainHeight} - (${jsonHeaderHeight}) - ${actionsHeight})`
// Two JSON previews (with margin) below each other, the actions in between
export const EDC_JSON_PREVIEW_WITH_ACTIONS_HALF_HEIGHT = `calc((${mainHeight} - 2 * (${jsonHeaderHeight}) - ${actionsHeight} - 8px) / 2)`
// As above, with actions below the second JSON preview too
export const EDC_JSON_PREVIEW_WITH_TWO_ACTIONS_HALF_HEIGHT = `calc((${mainHeight} - 2 * (${jsonHeaderHeight}) - 2 * ${actionsHeight} - 8px) / 2)`

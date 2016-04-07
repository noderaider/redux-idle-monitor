/** Lib Constants */
export const LIB_NAME = 'redux-idle-monitor'

/** Redux state root level key */
export const ROOT_STATE_KEY = 'idle'

export const ACTION_PREFIX = 'IDLEMONITOR'

/** Action Blueprint Name Constants */
export const START = 'START'
export const STOP = 'STOP'
export const RESET = 'RESET'

export const ACTIVITY = 'ACTIVITY'
export const ACTIVITY_DETECTION = 'ACTIVITY_DETECTION'

export const USER_ACTIVE = 'USER_ACTIVE'

export const IS_DEV = process.env.NODE_ENV !== 'production'

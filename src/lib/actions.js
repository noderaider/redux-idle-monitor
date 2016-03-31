import { createAction } from 'redux-actions'
import { IDLE_STATE } from './constants'

/** Redux Action Creators */
export const setIdleState = createAction(IDLE_STATE)

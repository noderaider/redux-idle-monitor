# redux-idle-monitor

A component that adds Redux functionality for invoking events at various times of idleness during a users session.


# [redux-idle-monitor](https://npmjs.com/packages/redux-idle-monitor)

Redux middleware, reducer, and actions for idle state monitoring in the browser.

`npm i -S redux-idle-monitor`

Can be used standalone with redux or in tandem with [react-redux-idle-monitor](https://npmjs.com/packages/react-redux-idle-monitor) to track whether a user is idle and progress them through a set of idle status actions with varying timeouts.

#### How it works

redux-idle-monitor works similiar to other redux libraries (e.g. redux-form) except that it exports a configure function that accepts options from the library consumer and returns an object with middleware, reducer, and actions keys.  The input options allow redux-idle-monitor to configure the idle statuses that will occur at varying times of idleness within your app as well as actions to dispatch when your users transition to an active status, or any one of your configured idle statuses.

**middleware** - The middleware that gets returned from configure handles listening for and scheduling idle status events, and enabling and disabling the detection of user activity. It should be added to your redux middleware array in both development and production versions. redux-idle-monitor requires you to be using thunk-middleware at this time (I'd like to add saga support soon). When process.env.NODE_ENV !== 'production' additional assertions are made throughout redux-idle-monitor that will be removed in your production build if you use UglifyJS or similiar mangler.

**reducer** - The reducer that gets returned from configure should be imported into your reducer tree as a top level 'idle' node (the same way that you would import redux-form or react-redux-router). At this time, the idle node cannot be changed, but if its a common request, it can be modified to support other arrangements easily.

**actions** - The actions object that is returned from configure contains start and stop actions that can be dispatched from anywhere in your app that has access to your stores dispatch function. redux-idle-monitor does not start monitoring user activity until you dispatch the start action. Good places to run these might be in the same area that your app authorizes users (start monitoring whether the user is idle when authorized and stop when the user is logged out).

#### Usage

The best way to configure redux-idle-monitor and then use the configured middleware, reducer, and actions within your app are to create a redux-idle-monitor component directory in the same area of your app that you configure your redux store.  For this example, I've put it in src/state/components/redux-idle-monitor.  Create an index.js file to house your configuration:

**src/state/components/redux-idle-monitor/index.js**

```js
import configure from 'redux-idle-monitor'
import { IDLE_STATUSES } from './constants'
import { idleStatusDelay, activeStatusAction, idleStatusAction } from './actions'

const opts =  { appName: 'todo-app'
              , IDLE_STATUSES
              , idleStatusDelay
              , activeStatusAction
              , idleStatusAction
              }

const { middleware, reducer, actions } = configure(opts)
export { middleware, reducer, actions }
```

As shown above this is importing an `IDLE_STATUSES` constant from constants.js. IDLE_STATUSES are a simple array of string constant statuses that are used for the idleStatus property of redux idle state. The initial value for idleStatus will always be `ACTIVE` and from there it will progress through your configured `IDLE_STATUSES` in order until it reaches the final one where it will progress no further. Here is an example of what the constants.js could look like:

**src/state/components/react-idle-monitor/constants.js**

```js
export const IDLESTATUS_AWAY = 'AWAY'
export const IDLESTATUS_INACTIVE = 'INACTIVE'
export const IDLESTATUS_EXPIRED = 'EXPIRED'

export const IDLE_STATUSES = [IDLESTATUS_AWAY, IDLESTATUS_INACTIVE, IDLESTATUS_EXPIRED]
```

In addition, we are also importing `idleStatusDelay`, `activeStatusAction`, and `idleStatusAction` from actions.js in the same directory. `idleStatusDelay` is a thunk that accepts an idle status string and expects a thunk with optional `(dispatch, getState)` args be returned. The thunk gets dispatched by idle middleware and should return a number in milliseconds that will be used as the delay that must occur before transitioning into that idle status.  If any user activity is detected, the user will transition back to `ACTIVE` idle status and the cycle will start over. The middleware will throw if a valid number is not returned from the `idleStatusDelay` thunk. The params `activeStatusAction` and `idleStatusAction` are `(dispatch, getState)` thunks that will be dispatched by the idle middleware. `activeStatusAction` will get dispatched every time a user becomes active after being in one of the idle status states. `idleStatusAction` gets dispatched every time the user transitions into one of your configured idle statuses.  These three actions are where all of your app logic should be configured (displaying a message when the user goes away, screensaver, etc.).


```js
import { AWAY_STATUS, IDLESTATUS_INACTIVE, IDLESTATUS_EXPIRED } from './constants'

//...

export const idleStatusDelay = idleStatus => (dispatch, getState) => {
  if(idleStatus === IDLESTATUS_AWAY)
    return 20000 // User becomes away after 20 seconds inactivity
  if(idleStatus === IDLESTATUS_INACTIVE)
    return getInactiveDelayFromDB() // Call database to look up the users delay time
  if(idleStatus === IDLESTATUS_EXPIRED)
    return 60000 // Log them out after another minute after they enter the inactive status
}

export const activeStatusAction = (dispatch, getState) => alert('welcome back!')

export const idleStatusAction = idleStatus => (dispatch, getState) => {
  if(idleStatus === IDLESTATUS_AWAY)
    console.info('user is away...')
  if(idleStatus === IDLESTATUS_INACTIVE)
    alert('You still there or what??')
  if(idleStatus === IDLESTATUS_EXPIRED)
    dispatch(logout())
}

```

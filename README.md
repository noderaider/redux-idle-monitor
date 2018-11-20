[![NPM](https://raw.githubusercontent.com/noderaider/redux-idle-monitor/master/public/png/redux-idle-monitor.png)](https://npmjs.com/packages/redux-idle-monitor)

**A React component and Redux connector to add functionality to invoke events at various stages of idleness during a users session.**

[![NPM](https://nodei.co/npm/redux-idle-monitor.png?stars=true&downloads=true)](https://nodei.co/npm/redux-idle-monitor/)

:zap: **Now supports realtime synchronization across tabs when user is active. Tested IE10+ / Edge, Chrome, FireFox**

`npm i -S redux-idle-monitor`

Can be used standalone with redux or in tandem with [react-redux-idle-monitor](https://npmjs.com/package/react-redux-idle-monitor) to track whether a user is idle and progress them through a set of idle status actions with varying timeouts.

See a working demo in a real project at [redux-webpack-boilerplate](https://redux-webpack-boilerplate.js.org)

___

### How it works

redux-idle-monitor works similiar to other redux libraries (e.g. redux-form) except that it exports a configure function that accepts options from the library consumer and returns an object with middleware, reducer, and actions keys.  The input options allow redux-idle-monitor to configure the idle statuses that will occur at varying times of idleness within your app as well as actions to dispatch when your users transition to an active status, or any one of your configured idle statuses.

**middleware** - The middleware that gets returned from configure handles listening for and scheduling idle status events, and enabling and disabling the detection of user activity. It should be added to your redux middleware array in both development and production versions. redux-idle-monitor requires you to be using thunk-middleware at this time (I'd like to add saga support soon). When process.env.NODE_ENV !== 'production' additional assertions are made throughout redux-idle-monitor that will be removed in your production build if you use UglifyJS or similiar mangler.

**reducer** - The reducer that gets returned from configure should be imported into your reducer tree as a top level 'idle' node (the same way that you would import redux-form or react-redux-router). At this time, the idle node cannot be changed, but if its a common request, it can be modified to support other arrangements easily.

**actions** - The actions object that is returned from configure contains start and stop actions that can be dispatched from anywhere in your app that has access to your stores dispatch function. redux-idle-monitor does not start monitoring user activity until you dispatch the start action. Good places to run these might be in the same area that your app authorizes users (start monitoring whether the user is idle when authorized and stop when the user is logged out).

___


### Configuration


The best way to configure redux-idle-monitor and then use the configured middleware, reducer, and actions within your app are to create a redux-idle-monitor component directory in the same area of your app that you configure your redux store.  For this example, I've put it in src/state/components/redux-idle-monitor.  Create an index.js file to house your configuration:

**src/state/components/redux-idle-monitor/index.js**

```js
import configure from 'redux-idle-monitor'
import { IDLE_STATUSES } from './constants'
import { idleStatusDelay, activeStatusAction, idleStatusAction } from './actions'

// These are the default events that will trigger user active status but can be customized if provided.
const activeEvents =  [ 'mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mouseWheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove' ]

const opts =  { appName: 'todo-app'
              , IDLE_STATUSES
              , idleStatusDelay
              , activeStatusAction
              , idleStatusAction
              , activeEvents
              }

const { middleware, reducer, actions } = configure(opts)
export { middleware, reducer, actions }
```


##### Configurable Constants


As shown above this is importing an `IDLE_STATUSES` constant from constants.js. IDLE_STATUSES are a simple array of string constant statuses that are used for the idleStatus property of redux idle state. The initial value for idleStatus will always be `ACTIVE` and from there it will progress through your configured `IDLE_STATUSES` in order until it reaches the final one where it will progress no further. Here is an example of what the constants.js could look like:

**src/state/components/react-idle-monitor/constants.js**

```js
export const IDLESTATUS_AWAY = 'AWAY'
export const IDLESTATUS_INACTIVE = 'INACTIVE'
export const IDLESTATUS_EXPIRED = 'EXPIRED'

export const IDLE_STATUSES = [IDLESTATUS_AWAY, IDLESTATUS_INACTIVE, IDLESTATUS_EXPIRED]
```


##### Configurable Actions


In addition, we are also importing `idleStatusDelay`, `activeStatusAction`, and `idleStatusAction` from actions.js within the same directory.

**src/state/components/react-idle-monitor/actions.js**

```js
import { IDLESTATUS_AWAY, IDLESTATUS_INACTIVE, IDLESTATUS_EXPIRED } from './constants'

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

___



`idleStatusDelay: (idleStatus) => (dispatch, getState) => delay`

*where*

`typeof delay === 'number'`

* accepts idleStatus string argument and returns a thunk action that will return the delay for any idle status that you've configured.
* gets dispatched by idle middleware to get the number of milliseconds of user idleness that must occur before transitioning into the specified idle status.
* if user activity is detected the user will transition back to the `ACTIVE` state.
* will throw if the thunk action does not return a number type for any idleStatus specified in the `IDLE_STATUSES` array.


`activeStatusAction: (dispatch, getState) => void`

* returns logic to be executed in your app whenever the user enters the `ACTIVE` status.
* dispatched by idle middleware only when the user has transitioned to one of your idle statuses and then back into the `ACTIVE` status.


`idleStatusAction: (idleStatus) => (dispatch, getState) => void`

* accepts idleStatus string argument and returns a thunk action to run app logic that should occur when user enters one of your configured idle statuses.
* should contain logic that handles every configured idle status that was passed in the `IDLE_STATUSES` array when configured.
* run logic to show the user alerts, screensavers, auto-logout etc. from here.


### Integration

Now you must import import the configured reducer into your top level combineReducers as the 'idle' node like so (api and errors are two of your other top level reducers in this example).

**src/state/reducers/index.js**

```js
import { combineReducers } from 'redux'
import { api } from './api'
import { errors } from './errors'
import { reducer as form } from 'redux-form'
import { reducer as idle } from '../components/redux-idle-monitor'

const rootReducer = combineReducers({ api
                                    , errors
                                    , form
                                    , idle
                                    })
export default rootReducer
```


The last step is to import the idle middleware into your store and dispatch the `start` action when you want to start monitoring user idleness.

**src/state/store/configureStore.js**

```js
import { createStore, applyMiddleware, compose } from 'redux'
import rootReducer from '../reducers'
import DevTools from '../../containers/DevTools'
import { middleware as idleMiddleware } from '../components/redux-idle-monitor'
import { actions as idleActions } from '../comonents/redux-idle-monitor'

import { thunk, readyStatePromise, createLogger, crashReporter } from 'redux-middleware'

const logger = createLogger()

const composeStore = compose( applyMiddleware(thunk, idleMiddleware, readyStatePromise, logger, crashReporter)
                            , DevTools.instrument()
                            )(createStore)

export default function configureStore() {
  const store = composeStore(rootReducer)

  // Will start the idle monitoring when the user logs in, and stop it if the user is signed out.
  store.subscribe(() => {
    let previousIsAuthorized = currentIsAuthorized
    let state = store.getState()
    // calls a function that selects whether the user is authorized from the current state
    currentIsAuthorized = selectIsAuthorized(state)

    if(currentIsAuthorized !== previousIsAuthorized)
      store.dispatch((currentIsAuthorized ? idleActions.start : idleActions.stop)())
  })
  return store
}
```

___


You're done. Please open an [issue](https://github.com/noderaider/redux-idle-monitor/issues) if there are any features that you would like to see added.

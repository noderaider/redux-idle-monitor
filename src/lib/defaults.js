export const getTimeStamp = () => new Date().toTimeString()

export const getActiveEvents = () => [ 'mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mouseWheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove' ]

export const getUseFastState = () => true
export const getUseLocalState = () => true
export const getUseWebRTCState = () => true
export const getUseWebSocketsState = () => true

export const getThresholds = ({ mouse = 10, elapsedMS = 1000 } = { mouse: 10, elapsedMS: 1000 }) => ({ mouse, elapsedMS })

export const getLevel = () => 'info'

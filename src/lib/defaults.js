export const getTimeStamp = () => new Date().toTimeString()

export const getActiveEvents = () => [ 'mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mouseWheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove' ]

export const getUseFastState = () => true
export const getUseLocalState = () => true
export const getUseWebRTCState = () => true
export const getUseWebSocketsState = () => true

export const getThresholds = ({ mouse = 20, elapsedMS = 2000, phaseOnMS = 500, phaseOffMS = 500 } = {}) => ({ mouse, elapsedMS, phaseOnMS, phaseOffMS })

export const getLevel = () => 'info'

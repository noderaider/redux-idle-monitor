export const getNextIdleStatusIn = idleStatuses => idleStatus => {
    let nextIdleStatusIndex = idleStatuses.indexOf(idleStatus) + 1;
    if (nextIdleStatusIndex < idleStatuses.length)
        return idleStatuses[nextIdleStatusIndex];
};
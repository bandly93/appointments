

export function createEventEmitter() {
  const subscribers = new Map()

  // Registers a callback for an event.
  // If the event doesn't exist yet, create a new Set to hold its subscribers.
  function subscribe(eventName: string, callback) {
    if (!subscribers.has(eventName)) {
      subscribers.set(eventName, new Set())
    }

    subscribers.get(eventName).add(callback)

    return () => {
      subscribers.get(eventName)?.delete(callback)
    }
  }

  function publish(eventName: string, payload) {
    const callbacks = subscribers.get(eventName)

    if (!callbacks) return

    // find everyone that is listening to this event and give each of them the payload.
    for (const callback of callbacks) {
      callback(payload)
    }
  }

  return {
    subscribe,
    publish
  }
}
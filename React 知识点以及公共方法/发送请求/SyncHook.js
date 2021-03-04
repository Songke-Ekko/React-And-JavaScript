/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


import Hook from './Hook'
import HookCodeFactory from './HookCodeFactory'

class SyncHookCodeFactory extends HookCodeFactory {
  content({
    onError, onResult, onDone, rethrowIfPossible
  }) {
    return this.callTapsSeries({
      onError: (i, err) => onError(err),
      onDone,
      rethrowIfPossible
    })
  }
}

const factory = new SyncHookCodeFactory()

class SyncHook extends Hook {
  tapAsync() {
    throw new Error('tapAsync is not supported on a SyncHook')
  }

  tapPromise() {
    throw new Error('tapPromise is not supported on a SyncHook')
  }

  compile(options) {
    factory.setup(this, options)
    return factory.create(options)
  }
}

export default SyncHook

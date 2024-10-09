export class InputMask {
    #unmaskedChar = '*'
    #overlay: HTMLElement | null = null
  
    defaultValue = ''
    pattern: string = ''
    displayMask: string = ''
    valueType: 'raw' | 'formatted' = 'raw'
    enableMasking: boolean = false
    inputType: 'text' | 'numeric' = 'text' // text or numeric
  
    constructor(public input: HTMLInputElement) {}
  
    #inputHander?: (evt: CustomEvent<{ value: string; formattedValue: string }>) => void
    onInput(handler: (evt: CustomEvent<{ value: string; formattedValue: string }>) => void) {
      this.#inputHander = handler
    }
  
    attach(params: {
      defaultValue?: string
      pattern?: string
      displayMask?: string
      valueType?: 'raw' | 'formatted'
      enableMasking?: boolean
      inputType?: 'text' | 'numeric'
    }) {
      this.detatch()
  
      const { defaultValue, pattern, displayMask, valueType, enableMasking, inputType } = params
  
      this.defaultValue = defaultValue || ''
      this.pattern = pattern || ''
      this.displayMask = displayMask || ''
      this.valueType = valueType || 'raw'
      this.enableMasking = enableMasking || false
      this.inputType = inputType || 'text'
  
      const input = this.input
      input.addEventListener('input', this.inputHandler)
      input.addEventListener('keydown', this.keyDownHandler)
      input.addEventListener('select', this.selectHandler)
      input.addEventListener('mouseup', this.mouseUpHandler)
      input.addEventListener('cut', this.cutHandler)
      input.addEventListener('copy', this.copyHandler)
  
      input.value = this.applyMask(this.defaultValue, this.displayMask, this.pattern)
    }
  
    invalidate() {
      const input = this.input
      this.applyMask(input.value, this.displayMask, this.pattern)
    }
  
    getValue() {
      const unmaskedCharsRegex = this.getUnmaskedCharsRegex()
      return this.input.value.replace(unmaskedCharsRegex, '')
    }
  
    setValue(value: string) {
      this.applyMask(value, this.displayMask, this.pattern)
    }
  
    getFormattedValue() {
      return this.input.value
    }
  
    getPattern() {
      return this.pattern
    }
  
    setPattern(value: string) {
      this.pattern = value
      this.invalidate()
    }
  
    getDisplayMask() {
      return this.displayMask
    }
  
    setDisplayMask() {
      this.invalidate()
    }
  
    detatch() {
      this.defaultValue = ''
      this.pattern = ''
      this.displayMask = ''
      this.valueType = 'raw'
      this.enableMasking = false
      this.inputType = 'text'
  
      const input = this.input
      input.removeEventListener('input', this.inputHandler)
      input.removeEventListener('keydown', this.keyDownHandler)
      input.removeEventListener('select', this.selectHandler)
      input.removeEventListener('mouseup', this.mouseUpHandler)
      input.removeEventListener('cut', this.cutHandler)
      input.removeEventListener('copy', this.copyHandler)
  
      input.value = ''
    }
  
    attachOverlay(overlay: HTMLElement) {
      if (overlay) {
        this.detachOverlay()
  
        const computedStyle = getComputedStyle(this.input)
        const overlayStyle = overlay.style
        overlayStyle.position = 'absolute'
        overlayStyle.top = '-1.5px'
        overlayStyle.left = '0'
        overlayStyle.pointerEvents = 'none'
        overlayStyle.padding = computedStyle.padding
        overlayStyle.width = computedStyle.width
        overlayStyle.height = computedStyle.height
        overlayStyle.border = computedStyle.border
        overlayStyle.borderColor = 'transparent'
        overlayStyle.fontFamily = computedStyle.fontFamily
        overlayStyle.fontSize = computedStyle.fontSize
        overlayStyle.color = 'red'
        // @ts-expect-error - false TS error for replaceAll
        overlay.innerHTML = this.pattern.replaceAll(this.#unmaskedChar, '&nbsp;')
        this.#overlay = overlay
      }
      this.displayMask = ''
      this.applyMask(this.input.value, this.displayMask, this.pattern)
    }
  
    detachOverlay() {
      if (this.#overlay) {
        // @ts-expect-error - false TS error for setting style
        this.#overlay.style = ''
        this.#overlay = null
      }
    }
  
    getUnmaskedCharsRegex = () => {
      if (this.inputType === 'numeric') {
        return /[^0-9]/g
      }
      return /[^a-zA-Z0-9]/g
    }
  
    getMaskedCharsRegex = () => {
      if (this.inputType === 'numeric') {
        return /[0-9]/
      }
      return /[a-zA-Z0-9]/
    }
  
    mouseUpHandler = () => {
      setTimeout(() => this.selectHandler())
    }
  
    cutHandler = () => {
      const input = this.input
      const unmaskedCharsRegex = this.getUnmaskedCharsRegex()
      const selectionStart = input.selectionStart || 0
      const selectionEnd = input.selectionEnd || selectionStart
  
      let text = input.value.slice(selectionStart, selectionEnd)
  
      // return raw value if valueType is 'raw', otherwise return formatted value
      text = this.valueType === 'raw' ? text.replace(unmaskedCharsRegex, '') : text
      navigator.clipboard.writeText(text)
  
      // need to allow the native browser to perform cut before updating selection
      setTimeout(() => {
        const newPosition = this.findPreviousPosition(input.value, selectionEnd, true)
        this.input.setSelectionRange(newPosition, newPosition)
      })
    }
  
    copyHandler = (e: ClipboardEvent) => {
      e.preventDefault()
      const input = this.input
      const unmaskedCharsRegex = this.getUnmaskedCharsRegex()
  
      const selectionStart = input.selectionStart || 0
      const selectionEnd = input.selectionEnd || selectionStart
      let text = input.value.slice(selectionStart, selectionEnd)
  
      // return raw value if valueType is 'raw', otherwise return formatted value
      text = this.valueType === 'raw' ? text.replace(unmaskedCharsRegex, '') : text
      navigator.clipboard.writeText(text)
    }
  
    selectHandler = () => {
      const input = this.input
      const maskedCharsRegex = this.getMaskedCharsRegex()
  
      const value = input.value
      // use regex to find the last masked character position in value
      // @ts-expect-error - false TS error from compiler
      const lastMaskedCharPos = value.split('').findLastIndex((char: string) => maskedCharsRegex.test(char)) + 1
  
      //  check that cursor is within the bounds of a masked character
      const selectionStart = input.selectionStart || 0
      let selectionEnd = input.selectionEnd || selectionStart
  
      if (selectionEnd > lastMaskedCharPos) {
        selectionEnd = lastMaskedCharPos
      }
  
      input.setSelectionRange(selectionStart, selectionEnd)
    }
  
    inputHandler = () => {
      const unmaskedCharsRegex = this.getUnmaskedCharsRegex()
      const maskedCharsRegex = this.getMaskedCharsRegex()
  
      const input = this.input
      const cursorPosition = input.selectionStart ?? 0
      const oldValue = input.value
      const strippedValue = oldValue.replace(unmaskedCharsRegex, '')
  
      const newValue = this.enableMasking ? this.applyMask(strippedValue, this.displayMask, this.pattern) : strippedValue
  
      // Count input characters before cursor
      const inputCharsBefore = oldValue.slice(0, cursorPosition).replace(unmaskedCharsRegex, '').length
  
      // Find new cursor position
      let newCursorPosition = 0
      let charCount = 0
      for (let i = 0; i < newValue.length; i++) {
        if (charCount === inputCharsBefore) {
          newCursorPosition = i
          break
        }
        if (maskedCharsRegex.test(newValue[i])) {
          charCount++
        }
      }
  
      input.value = newValue
      if (newCursorPosition === 0) {
        newCursorPosition = newValue.length
        input.setSelectionRange(newCursorPosition, newCursorPosition)
      } else {
        input.setSelectionRange(newCursorPosition, newCursorPosition)
      }
  
      this.#inputHander?.(
        new CustomEvent('input', {
          detail: {
            value: this.valueType === 'raw' ? newValue.replace(unmaskedCharsRegex, '') : newValue,
            formattedValue: newValue,
          },
        })
      )
    }
  
    keyDownHandler = (e: KeyboardEvent) => {
      const input = this.input
      let startSelection = input.selectionStart ?? 0
      let endSelection = input.selectionEnd ?? 0
      const value = input.value
      const keyCode = e.key.toLowerCase()
  
      if (keyCode === 'arrowright') {
        e.preventDefault()
  
        let lastInputPosition = value.lastIndexOf(this.#unmaskedChar)
        // if lastInputPosition is -1, then there are no unmasked characters in the input remaining
        if (lastInputPosition === -1) {
          lastInputPosition = this.pattern.length
        }
  
        const positionBeforeUnmaskedChar = e.shiftKey ? true : false
        const currentPosition = endSelection
        let newPosition = this.findNextPosition(value, currentPosition, positionBeforeUnmaskedChar)
  
        // Ensure the cursor doesn't move beyond the last input character
        newPosition = Math.min(newPosition, lastInputPosition)
  
        if (e.shiftKey) {
          endSelection = newPosition
          input.setSelectionRange(startSelection, endSelection)
        } else {
          input.setSelectionRange(newPosition, newPosition)
        }
      } else if (keyCode === 'arrowleft') {
        e.preventDefault()
  
        const positionAfterUnmaskedChar = e.shiftKey ? true : false
        const currentPosition = startSelection ?? 0
        const newPosition = this.findPreviousPosition(input.value, currentPosition, positionAfterUnmaskedChar)
  
        if (e.shiftKey) {
          startSelection = newPosition
          input.setSelectionRange(startSelection, endSelection)
        } else {
          // if shift key is not pressed, move cursor without selection
          input.setSelectionRange(newPosition, newPosition)
        }
      } else if (keyCode === 'backspace') {
        // need to allow the native browser to perform cut before updating selection
        setTimeout(() => {
          const newPosition = this.findPreviousPosition(input.value, startSelection)
          input.setSelectionRange(newPosition, newPosition)
        })
      } else if (keyCode === 'delete') {
        // need to allow the native browser to perform cut before updating selection
        setTimeout(() => {
          const newPosition = this.findPreviousPosition(input.value, endSelection, true)
          input.setSelectionRange(newPosition, newPosition)
        })
      }
    }
  
    applyMask = (value = '', displayMask = '', pattern = '') => {
      if (!this.enableMasking) return value
  
      const mask = displayMask || pattern
      let maskedValue = ''
      let valueIndex = 0
  
      const len = mask.length
      for (let i = 0; i < len; i++) {
        if (pattern[i] === this.#unmaskedChar) {
          maskedValue += valueIndex < value.length ? value[valueIndex++] : mask[i]
        } else {
          maskedValue += mask[i]
        }
      }
  
      if (displayMask) {
        return maskedValue
      }
      const index = this.findLastMaskedChar(maskedValue)
      return maskedValue.slice(0, index + 1)
    }
  
    findLastMaskedChar = (str: string) => {
      const maskedChars = this.getMaskedCharsRegex()
      for (let i = str.length - 1; i >= 0; i--) {
        if (maskedChars.test(str[i])) {
          return i
        }
      }
      return -1
    }
  
    findNextPosition = (value: string, currentPosition: number, positionBeforeUnmaskedChar = false) => {
      const maskedCharsRegex = this.getMaskedCharsRegex()
  
      // use regex to find the last masked character position in value
      // @ts-expect-error - a false typescript error for findLastIndex
      const endPosition = Number(value.split('').findLastIndex(char => maskedCharsRegex.test(char))) + 1
  
      let newPosition = positionBeforeUnmaskedChar ? currentPosition : currentPosition + 1
      // while the new position is less than the value length, check if the next character is unmasked
      while (newPosition < endPosition) {
        // if the next character is unmasked, return the new position
        if (this.pattern[newPosition] === this.#unmaskedChar) {
          // if the new position is less than the last masked character position, return the new position
          return Number(Math.min(positionBeforeUnmaskedChar ? newPosition + 1 : newPosition, endPosition))
        }
  
        // if the next character is not unmasked, continue to the next character
        newPosition++
      }
      // if no next position is found, return the last masked character position
      return endPosition
    }
  
    findPreviousPosition = (_value: string, currentPosition: number, positionAfterUnmaskedChar = false) => {
      const startPosition = 0
  
      let newPosition = positionAfterUnmaskedChar ? currentPosition : currentPosition - 1
      while (newPosition > startPosition) {
        // if the previous character is unmasked, return the new position
        if (this.pattern[newPosition - 1] === this.#unmaskedChar) {
          return Number(Math.max(positionAfterUnmaskedChar ? newPosition - 1 : newPosition, startPosition))
        }
        newPosition--
      }
      return startPosition
    }
  }
  
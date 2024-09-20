function maskIt(input, params) {
    const unmaskedChar = '*'
    const defaultValue = params.defaultValue
    const pattern = params.pattern
    const displayMask = params.displayMask
    const valueType = params.valueType
    const enableMasking = params.enableMasking
    const inputType = params.inputType
  
    if (enableMasking) {
      // Set initial value based on enableMasking
      input.addEventListener('input', inputHandler)
      input.addEventListener('keydown', keyDownHandler)
      input.addEventListener('select', selectHandler)
      input.addEventListener('mouseup', mouseUpHandler)
      input.addEventListener('cut', cutHandler)
      input.addEventListener('copy', copyHandler)
    }
  
    function getUnmaskedCharsRegex() {
      if (inputType === 'numeric') {
        return /[^0-9]/g
      }
      return /[^a-zA-Z0-9]/g
    }
  
    function getMaskedCharsRegex() {
      if (inputType === 'numeric') {
        return /[0-9]/
      }
      return /[a-zA-Z0-9]/
    }
  
    function mouseUpHandler(e) {
      setTimeout(() => selectHandler(e))
    }
  
    function cutHandler(e) {
      const unmaskedCharsRegex = getUnmaskedCharsRegex()
  
      const selectionStart = input.selectionStart
      const selectionEnd = input.selectionEnd
      let text = input.value.slice(selectionStart, selectionEnd)
  
      // return raw value if valueType is 'raw', otherwise return formatted value
      text = valueType === 'raw' ? text.replace(unmaskedCharsRegex, '') : text
      navigator.clipboard.writeText(text)
  
      // need to allow the native browser to perform cut before updating selection
      setTimeout(() => {
        newPosition = findPreviousPosition(e.target.value, selectionEnd, true)
        input.setSelectionRange(newPosition, newPosition)
      })
    }
  
    function copyHandler(e) {
      e.preventDefault()
      const unmaskedCharsRegex = getUnmaskedCharsRegex()
  
      const selectionStart = input.selectionStart
      const selectionEnd = input.selectionEnd
      let text = input.value.slice(selectionStart, selectionEnd)
  
      // return raw value if valueType is 'raw', otherwise return formatted value
      text = valueType === 'raw' ? text.replace(unmaskedCharsRegex, '') : text
      navigator.clipboard.writeText(text)
    }
  
    function selectHandler(e) {
      const maskedCharsRegex = getMaskedCharsRegex()
  
      let value = e.target.value
      // use regex to find the last masked character position in value
      const lastMaskedCharPos = value.split('').findLastIndex(char => maskedCharsRegex.test(char)) + 1
  
      //  check that cursor is within the bounds of a masked character
      let selectionStart = input.selectionStart
      let selectionEnd = input.selectionEnd
  
      if (selectionEnd > lastMaskedCharPos) {
        selectionEnd = lastMaskedCharPos
      }
  
      input.setSelectionRange(selectionStart, selectionEnd)
    }
  
    function inputHandler(e) {
      const unmaskedCharsRegex = getUnmaskedCharsRegex()
      const maskedCharsRegex = getMaskedCharsRegex()
  
      let input = e.target
      let cursorPosition = input.selectionStart
      let oldValue = input.value
      let strippedValue = oldValue.replace(unmaskedCharsRegex, '')
  
      let newValue = enableMasking ? applyMask(strippedValue, displayMask, pattern) : strippedValue
  
      // Count input characters before cursor
      let inputCharsBefore = oldValue.slice(0, cursorPosition).replace(unmaskedCharsRegex, '').length
  
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
    }
  
    function keyDownHandler(e) {
      let startSelection = e.target.selectionStart
      let endSelection = e.target.selectionEnd
      let value = e.target.value
      const input = e.target
      const keyCode = e.key.toLowerCase()
  
      if (keyCode === 'arrowright') {
        e.preventDefault()
  
        let lastInputPosition = value.lastIndexOf(unmaskedChar)
        // if lastInputPosition is -1, then there are no unmasked characters in the input remaining
        if (lastInputPosition === -1) {
          lastInputPosition = pattern.length
        }
  
        const positionBeforeUnmaskedChar = e.shiftKey ? true : false
        const currentPosition = endSelection
        let newPosition = findNextPosition(value, currentPosition, positionBeforeUnmaskedChar)
  
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
        const currentPosition = startSelection
  
        let newPosition = findPreviousPosition(e.target.value, currentPosition, positionAfterUnmaskedChar)
  
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
          newPosition = findPreviousPosition(e.target.value, startSelection)
          input.setSelectionRange(newPosition, newPosition)
        })
      } else if (keyCode === 'delete') {
        // need to allow the native browser to perform cut before updating selection
        setTimeout(() => {
          newPosition = findPreviousPosition(e.target.value, endSelection, true)
          input.setSelectionRange(newPosition, newPosition)
        })
      }
    }
  
    function applyMask(value, displayMask, pattern) {
      if (!enableMasking) return value
  
      const mask = displayMask || pattern
      let maskedValue = ''
      let valueIndex = 0
  
      const len = mask.length
      for (let i = 0; i < len; i++) {
        if (pattern[i] === unmaskedChar) {
          maskedValue += valueIndex < value.length ? value[valueIndex++] : mask[i]
        } else {
          maskedValue += mask[i]
        }
      }
  
      if (displayMask) {
        return maskedValue
      }
      const index = findLastMaskedChar(maskedValue)
      return maskedValue.slice(0, index + 1)
    }
  
    function findLastMaskedChar(str) {
      const maskedChars = getMaskedCharsRegex()
      for (let i = str.length - 1; i >= 0; i--) {
        if (maskedChars.test(str[i])) {
          return i
        }
      }
      return -1
    }
  
    function findNextPosition(value, currentPosition, positionBeforeUnmaskedChar = false) {
      const maskedCharsRegex = getMaskedCharsRegex()
  
      // use regex to find the last masked character position in value
      const endPosition = Number(value.split('').findLastIndex(char => maskedCharsRegex.test(char))) + 1
  
      let newPosition = positionBeforeUnmaskedChar ? currentPosition : currentPosition + 1
      // while the new position is less than the value length, check if the next character is unmasked
      while (newPosition < endPosition) {
        // if the next character is unmasked, return the new position
        if (pattern[newPosition] === unmaskedChar) {
          // if the new position is less than the last masked character position, return the new position
          return Number(Math.min(positionBeforeUnmaskedChar ? newPosition + 1 : newPosition, endPosition))
        }
  
        // if the next character is not unmasked, continue to the next character
        newPosition++
      }
      // if no next position is found, return the last masked character position
      return endPosition
    }
  
    function findPreviousPosition(value, currentPosition, positionAfterUnmaskedChar = false) {
      const startPosition = 0
  
      let newPosition = positionAfterUnmaskedChar ? currentPosition : currentPosition - 1
      while (newPosition > startPosition) {
        // if the previous character is unmasked, return the new position
        if (pattern[newPosition - 1] === unmaskedChar) {
          return Number(Math.max(positionAfterUnmaskedChar ? newPosition - 1 : newPosition, startPosition))
        }
        newPosition--
      }
      return startPosition
    }
  
    // Set initial value based on enableMasking
    if (enableMasking) {
      input.value = applyMask(defaultValue, displayMask, pattern)
  
      if (params.overlay) {
        const computedStyle = getComputedStyle(input)
        const overlay = params.overlay
        if (overlay) {
          overlay.style.position = 'absolute'
          overlay.style.top = 0
          overlay.style.left = 0
          overlay.style.pointerEvents = 'none'
          overlay.style.padding = computedStyle.padding
          overlay.style.width = computedStyle.width
          overlay.style.height = computedStyle.height
          overlay.style.border = computedStyle.border
          overlay.style.borderColor = 'transparent'
          overlay.style.fontFamily = computedStyle.fontFamily
          overlay.style.fontSize = computedStyle.fontSize
          overlay.style.color = 'red'
          overlay.innerHTML = pattern.replaceAll(unmaskedChar, '&nbsp;')
        }
      }
    }
  }
  
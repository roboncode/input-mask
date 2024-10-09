import { ChangeEvent, useEffect, useRef, useState } from 'react'
import './App.css'
import { InputMask } from './utils/InputMask'
// import MyComponent from './components/my-component'

let initted = false
function App() {

  const text1Ref = useRef(null)
  const text2Ref = useRef(null)
  const text3Ref = useRef(null)
  const overlayRef = useRef(null)

  const [text, setText] = useState('')
  const [formattedText, setFormattedText] = useState('')

  const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value)
    setText(e.target.value)
  }

  useEffect(() => {
    if (!initted) {

      if(text1Ref.current) {
        const maskIt = new InputMask(text1Ref.current as HTMLInputElement)
        maskIt.attach({
          enableMasking: true,
          defaultValue: '',
          pattern: '(***) ***-****',
          valueType: 'raw',
          inputType: 'text',
        })
        maskIt.onInput(e => {
          setText(e.detail.value)
          setFormattedText(e.detail.formattedValue)
        })
      }


      if(text2Ref.current) {
        const maskIt = new InputMask(text2Ref.current as HTMLInputElement)
        maskIt.attach({
          enableMasking: true,
          defaultValue: '',
          pattern: '(***) ***-****',
          displayMask: '(***) ***-****',
          valueType: 'raw',
          inputType: 'text',
        })
      }

      if(text3Ref.current) {
        const maskIt = new InputMask(text3Ref.current as HTMLInputElement)
        maskIt.attach({
          enableMasking: true,
          defaultValue: '',
          pattern: '(***) ***-****',
          // displayMask: '(***) ***-****',
          valueType: 'raw',
          inputType: 'text',
        })

        if( overlayRef.current) {
          maskIt.attachOverlay(overlayRef.current)
        }
      }
    }
    initted = true
  }, [])

  return (
    <div className='container'>

      <div>Plain Input</div>
      <div className='textbox'>
        <input type="text" value={text} onChange={changeHandler} />
      </div>

      <div>Input with format, no display mask</div>
      <div className="textbox">
        <input ref={text1Ref} value={formattedText} onChange={changeHandler} />
      </div>

      <div>Input with display mask</div>
      <div className="textbox">
        <input ref={text2Ref} value={formattedText} onChange={changeHandler} />
      </div>

      <div>Input with overlay</div>
      <div className="textbox">
        <input ref={text3Ref} value={formattedText} onChange={changeHandler} />
        <span ref={overlayRef} className="overlay"></span>
      </div>

      {/* <MyComponent /> */}

    </div>
  )
}

export default App

import React from 'react'

import { useState, useEffect } from 'react'
import { useAppSelector } from 'redux/store/hooks'
import { useAppDispatch } from 'redux/store/hooks'
import { runnerLintSnakefile } from 'redux/actions/runner'

import "./Footer.css"

function Footer() {
  const linter = useAppSelector(state => state.runner.linter);
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState("Linter")
  const [body, setBody] = useState("")

  const updateLinter = () => {
    dispatch(runnerLintSnakefile())
  }

  useEffect(() => {
    if (linter !== "") {
      const json = JSON.parse(linter)
      if (json['error']) {
        setBody("Linter Error:\n" + json['error'])
      } else if (json['rules'].length == 0) {
        // No linter comments
        setBody(" 😊 There are no linter messages!\n" + linter)
      }
      else
      {
        setBody(linter)
      }
    }
  }, [linter])

  return (
    <>
    <div className="footer">
      <p>{title}<br/>
      <textarea
        id="linter" {...{rows: 6}}
        style={{width: "65%"}}
        value={body}
        onChange={()=>{}}  // eslint-disable-line @typescript-eslint/no-empty-function
      />
      </p>
    </div>
    </>
  )
}

export default Footer;

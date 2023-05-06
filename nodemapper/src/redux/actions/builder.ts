import { createAction } from "@reduxjs/toolkit"

export const builderCompileToJson = createAction("builder/compile-to-json");
export const builderSubmitQuery = createAction<Record<string, any>>("builder/submit-query")  // eslint-disable-line @typescript-eslint/no-explicit-any

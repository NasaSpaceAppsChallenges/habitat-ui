import { atom } from "jotai";

export const boardConfigAtom = atom([
  {
    floors: [
        {
            level: 1,
            x: 8,
            y: 8
        }
    ]
  }
])
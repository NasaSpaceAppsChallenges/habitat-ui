import { atom } from "jotai";

export const moduleMakerConfigAtom = atom([
  {
    floors: [
      {
        level: 1,
        x: 12,
        y: 8,
      },
      {
        level: 2,
        x: 8,
        y: 8,
      },
      {
        level: 3,
        x: 6,
        y: 10,
      },
    ]
  }
]);
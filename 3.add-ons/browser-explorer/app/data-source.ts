import { appPath } from "../offline/paths.mjs";
export const brainDataPath = process.env.NEXT_PUBLIC_BRAIN_DATA_PATH || appPath("/brain-data.json");

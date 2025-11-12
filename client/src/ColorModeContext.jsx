import { createContext } from "react";

// Provides { mode, toggleColorMode } to components
const ColorModeContext = createContext({ mode: "light", toggleColorMode: () => {} });

export default ColorModeContext;

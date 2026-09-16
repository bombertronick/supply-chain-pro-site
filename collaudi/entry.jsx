import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app-under-test.jsx";
createRoot(document.getElementById("root")).render(React.createElement(App));

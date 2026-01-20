import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Home from "./pages/Home.tsx";
import { BrowserRouter, Routes, Route } from "react-router";
import Privacy from "./pages/Privacy.tsx";
import Login from "./pages/Login.tsx";
import App from "./pages/App.tsx";
import NotFound from "./pages/NotFound.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="*" element={<NotFound />} />
				{/* Public routes */}
				<Route path="/" element={<Home />} />
				<Route path="/privacy" element={<Privacy />} />
				<Route path="/login" element={<Login />} />
				<Route path="/app" element={<App />} />
			</Routes>
		</BrowserRouter>
	</StrictMode>,
);

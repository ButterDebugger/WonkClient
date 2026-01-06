import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Home from "./pages/Home.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Privacy from "./pages/Privacy.tsx";
import Login from "./pages/Login.tsx";
import App from "./pages/App.tsx";
import NotFound from "./pages/NotFound.tsx";

const router = createBrowserRouter([
	{
		path: "/",
		element: <Home />,
		errorElement: <NotFound />,
	},
	{
		path: "/privacy",
		element: <Privacy />,
	},
	{
		path: "/login",
		element: <Login />,
	},
	{
		path: "/app",
		element: <App />,
	},
]);

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
);

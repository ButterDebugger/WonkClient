import { useClientContext } from "./context";

export default function Rooms() {
	const client = useClientContext();

	console.log(client, client.stream);

	return <div>Rooms</div>;
}

import HomeClient from "./HomeClient";
import Mascot from "./components/Mascot";

export default function Home() {
  return <HomeClient mascot={<Mascot />} />;
}

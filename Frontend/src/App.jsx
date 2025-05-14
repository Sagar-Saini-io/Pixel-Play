import { useState } from "react";
import "./App.css";
import { ColourfulText } from "./components/ui/colourful-text";
import { SignupFormDemo } from "./components/SignUpForm";

import DrawerOpen from "./components/Drawer";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="bg-black h-screen w-full">
        <div className="text-4xl">
          <ColourfulText text="Pixel Play" />
        </div>
        {/* <h1 className="bg-orange-400">Hello</h1> */}
        {/* <SignupFormDemo /> */}
      </div>
    </>
  );
}

export default App;

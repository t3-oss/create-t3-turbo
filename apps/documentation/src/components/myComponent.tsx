import React, { useState } from "react";

export default function MyComponent() {
  const [bool, setBool] = useState(false);
  return (
    <div>
      <p>MyComponent rendered !</p>
      <p>bool={bool ? "true" : "false"}</p>
      <p>
        <button onClick={() => setBool((b) => !b)}>toggle bool</button>
      </p>
    </div>
  );
}

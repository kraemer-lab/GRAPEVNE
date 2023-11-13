import React from "react";
import { useState } from "react";
import { useAppSelector } from "redux/store/hooks";

const StatusBar: React.FC = () => {
  const [status, setStatus] = useState("");
  const statustext = useAppSelector((state) => state.builder.statustext);
  React.useEffect(() => {
    setStatus(statustext);
  }, [statustext]);
  return (
    <div
      className="status-bar"
      style={{
        fontSize: 14,
        marginLeft: "10px",
      }}
    >
      {status ? status : <br />}
    </div>
  );
};

export default StatusBar;
